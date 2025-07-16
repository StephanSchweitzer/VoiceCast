#!/usr/bin/env python3
"""
Training Pipeline Execution Script
This script orchestrates the complete model training pipeline.
"""

import os
import sys
import logging
import uuid
import yaml
import argparse
from datetime import datetime

# Add the ml_pipeline directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline_utils import GCPConfig, PipelineStatus, create_pipeline_config
from model.model_trainer import ModelTrainer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Run ML Training Pipeline')
    
    parser.add_argument(
        '--pipeline-id',
        type=str,
        default=None,
        help='Pipeline ID (auto-generated if not provided)'
    )
    
    parser.add_argument(
        '--dataset-path',
        type=str,
        required=True,
        help='GCS path to processed dataset'
    )
    
    parser.add_argument(
        '--config-path',
        type=str,
        default='/tmp/pipeline_config.yaml',
        help='Path to pipeline configuration file'
    )
    
    parser.add_argument(
        '--create-default-config',
        action='store_true',
        help='Create default configuration file'
    )
    
    parser.add_argument(
        '--validate-setup',
        action='store_true',
        help='Validate GCP setup before running pipeline'
    )
    
    parser.add_argument(
        '--model-type',
        type=str,
        choices=['mlp', 'transformer'],
        default='mlp',
        help='Model type to train'
    )
    
    parser.add_argument(
        '--epochs',
        type=int,
        default=None,
        help='Number of training epochs (overrides config)'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=None,
        help='Training batch size (overrides config)'
    )
    
    parser.add_argument(
        '--learning-rate',
        type=float,
        default=None,
        help='Learning rate (overrides config)'
    )
    
    return parser.parse_args()

def validate_environment():
    """Validate required environment variables"""
    required_env_vars = [
        'GCP_PROJECT_ID',
        'GCP_REGION'
    ]
    
    missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        return False
    
    return True

def create_default_config(config_path: str):
    """Create default pipeline configuration"""
    try:
        config = create_pipeline_config(config_path)
        logger.info(f"Default configuration created at: {config_path}")
        
        # Print configuration overview
        print("\\n=== Default Pipeline Configuration ===")
        print(yaml.dump(config, default_flow_style=False))
        
        return True
    except Exception as e:
        logger.error(f"Failed to create default configuration: {e}")
        return False

def validate_gcp_setup():
    """Validate GCP setup and permissions"""
    try:
        from pipeline_utils import validate_gcp_setup
        
        logger.info("Validating GCP setup...")
        validation_results = validate_gcp_setup()
        
        print("\\n=== GCP Validation Results ===")
        all_passed = True
        
        for check, result in validation_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{check}: {status}")
            if not result:
                all_passed = False
        
        if all_passed:
            logger.info("GCP setup validation passed")
            return True
        else:
            logger.error("GCP setup validation failed")
            return False
            
    except Exception as e:
        logger.error(f"GCP validation failed: {e}")
        return False

def load_configuration(config_path: str) -> dict:
    """Load pipeline configuration"""
    try:
        if not os.path.exists(config_path):
            logger.info(f"Configuration file not found at {config_path}, creating default")
            create_pipeline_config(config_path)
        
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        logger.info(f"Configuration loaded from: {config_path}")
        return config
        
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        raise

def update_config_with_args(config: dict, args) -> dict:
    """Update configuration with command line arguments"""
    if args.model_type:
        config['training']['model_type'] = args.model_type
    
    if args.epochs:
        config['training']['epochs'] = args.epochs
    
    if args.batch_size:
        config['training']['batch_size'] = args.batch_size
    
    if args.learning_rate:
        config['training']['learning_rate'] = args.learning_rate
    
    return config

def validate_dataset_path(dataset_path: str) -> bool:
    """Validate dataset path format"""
    if not dataset_path.startswith('gs://'):
        logger.error(f"Dataset path must be a GCS path (gs://...): {dataset_path}")
        return False
    
    if not dataset_path.endswith('.pkl'):
        logger.error(f"Dataset path must point to a .pkl file: {dataset_path}")
        return False
    
    return True

def run_training_pipeline(pipeline_id: str, dataset_path: str, config: dict) -> dict:
    """Run the complete training pipeline"""
    try:
        logger.info(f"Starting training pipeline: {pipeline_id}")
        
        # Initialize trainer
        trainer = ModelTrainer(config)
        
        # Run complete training pipeline
        result = trainer.run_training_pipeline(dataset_path, pipeline_id)
        
        logger.info(f"Training pipeline completed successfully: {pipeline_id}")
        return {
            'pipeline_id': pipeline_id,
            'status': 'completed',
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Training pipeline failed: {e}")
        return {
            'pipeline_id': pipeline_id,
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def main():
    """Main entry point"""
    args = parse_arguments()
    
    # Handle special commands
    if args.create_default_config:
        success = create_default_config(args.config_path)
        sys.exit(0 if success else 1)
    
    if args.validate_setup:
        success = validate_gcp_setup()
        sys.exit(0 if success else 1)
    
    # Validate environment
    if not validate_environment():
        logger.error("Environment validation failed")
        sys.exit(1)
    
    # Validate dataset path
    if not validate_dataset_path(args.dataset_path):
        logger.error("Dataset path validation failed")
        sys.exit(1)
    
    # Generate pipeline ID if not provided
    if not args.pipeline_id:
        pipeline_id = f"training-pipeline-{uuid.uuid4().hex[:8]}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    else:
        pipeline_id = args.pipeline_id
    
    logger.info(f"Pipeline ID: {pipeline_id}")
    logger.info(f"Dataset path: {args.dataset_path}")
    
    try:
        # Load configuration
        config = load_configuration(args.config_path)
        
        # Update configuration with command line arguments
        config = update_config_with_args(config, args)
        
        # Initialize pipeline status
        gcp_config = GCPConfig()
        pipeline_status = PipelineStatus(gcp_config)
        
        # Update initial status
        pipeline_status.update_status(
            pipeline_id, "running", 0.0, "Training pipeline started"
        )
        
        # Print training configuration
        print("\\n=== Training Configuration ===")
        print(f"Model Type: {config['training']['model_type']}")
        print(f"Epochs: {config['training']['epochs']}")
        print(f"Batch Size: {config['training']['batch_size']}")
        print(f"Learning Rate: {config['training']['learning_rate']}")
        print(f"Early Stopping: {config['training']['early_stopping']['patience']} epochs")
        
        # Run training pipeline
        result = run_training_pipeline(pipeline_id, args.dataset_path, config)
        
        # Print results
        print("\\n=== Training Results ===")
        print(f"Pipeline ID: {result['pipeline_id']}")
        print(f"Status: {result['status']}")
        print(f"Timestamp: {result['timestamp']}")
        
        if result['status'] == 'completed':
            training_result = result['result']
            print(f"Model GCS Path: {training_result['model_gcs_path']}")
            print(f"Vertex AI Model: {training_result['vertex_model_name']}")
            print("Final Metrics:")
            for metric, value in training_result['final_metrics'].items():
                if isinstance(value, float):
                    print(f"  {metric}: {value:.4f}")
                else:
                    print(f"  {metric}: {value}")
            
            logger.info("Training pipeline completed successfully")
        else:
            print(f"Error: {result['error']}")
            logger.error("Training pipeline failed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()