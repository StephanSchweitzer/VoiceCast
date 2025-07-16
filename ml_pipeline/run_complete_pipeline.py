#!/usr/bin/env python3
"""
Complete Pipeline Execution Script
This script orchestrates the complete end-to-end ML pipeline:
1. Data processing
2. Model training
3. Model deployment to Vertex AI
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
from data_processing.data_processor import DataProcessor
from model.model_trainer import ModelTrainer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Run Complete ML Pipeline')
    
    parser.add_argument(
        '--pipeline-id',
        type=str,
        default=None,
        help='Pipeline ID (auto-generated if not provided)'
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
        '--skip-data-processing',
        action='store_true',
        help='Skip data processing (use existing dataset)'
    )
    
    parser.add_argument(
        '--existing-dataset-path',
        type=str,
        help='Path to existing processed dataset (required if --skip-data-processing)'
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
    
    parser.add_argument(
        '--cleanup-temp-files',
        action='store_true',
        default=True,
        help='Clean up temporary files after completion'
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

def run_data_processing(pipeline_id: str, config: dict) -> str:
    """Run data processing pipeline"""
    try:
        logger.info(f"Starting data processing phase: {pipeline_id}")
        
        # Initialize data processor
        processor = DataProcessor(config)
        
        # Run data processing pipeline
        dataset_path = processor.run_complete_pipeline(f"{pipeline_id}-data")
        
        logger.info(f"Data processing completed: {dataset_path}")
        return dataset_path
        
    except Exception as e:
        logger.error(f"Data processing failed: {e}")
        raise

def run_model_training(pipeline_id: str, dataset_path: str, config: dict) -> dict:
    """Run model training pipeline"""
    try:
        logger.info(f"Starting model training phase: {pipeline_id}")
        
        # Initialize trainer
        trainer = ModelTrainer(config)
        
        # Run training pipeline
        training_result = trainer.run_training_pipeline(dataset_path, f"{pipeline_id}-training")
        
        logger.info(f"Model training completed: {training_result['model_gcs_path']}")
        return training_result
        
    except Exception as e:
        logger.error(f"Model training failed: {e}")
        raise

def run_complete_pipeline(pipeline_id: str, config: dict, args) -> dict:
    """Run the complete end-to-end pipeline"""
    try:
        logger.info(f"Starting complete ML pipeline: {pipeline_id}")
        
        # Initialize pipeline status
        gcp_config = GCPConfig()
        pipeline_status = PipelineStatus(gcp_config)
        
        # Update initial status
        pipeline_status.update_status(
            pipeline_id, "running", 0.0, "Complete pipeline started"
        )
        
        # Phase 1: Data Processing
        if args.skip_data_processing:
            if not args.existing_dataset_path:
                raise ValueError("--existing-dataset-path is required when --skip-data-processing is used")
            
            dataset_path = args.existing_dataset_path
            logger.info(f"Skipping data processing, using existing dataset: {dataset_path}")
            
            pipeline_status.update_status(
                pipeline_id, "running", 0.5, "Skipped data processing, using existing dataset"
            )
        else:
            dataset_path = run_data_processing(pipeline_id, config)
            
            pipeline_status.update_status(
                pipeline_id, "running", 0.5, "Data processing completed"
            )
        
        # Phase 2: Model Training
        training_result = run_model_training(pipeline_id, dataset_path, config)
        
        pipeline_status.update_status(
            pipeline_id, "running", 0.9, "Model training completed"
        )
        
        # Compile final results
        final_result = {
            'pipeline_id': pipeline_id,
            'dataset_path': dataset_path,
            'model_gcs_path': training_result['model_gcs_path'],
            'vertex_model_name': training_result['vertex_model_name'],
            'final_metrics': training_result['final_metrics'],
            'model_config': training_result['model_config'],
            'timestamp': datetime.now().isoformat()
        }
        
        # Update final status
        pipeline_status.update_status(
            pipeline_id, "completed", 1.0, 
            "Complete pipeline finished successfully",
            metadata=final_result
        )
        
        logger.info(f"Complete pipeline finished successfully: {pipeline_id}")
        return final_result
        
    except Exception as e:
        logger.error(f"Complete pipeline failed: {e}")
        
        # Update failure status
        try:
            pipeline_status.update_status(
                pipeline_id, "failed", 0.0, f"Pipeline failed: {e}"
            )
        except:
            pass  # Don't fail if status update fails
        
        raise

def cleanup_temp_files():
    """Clean up temporary files"""
    try:
        import glob
        
        temp_patterns = [
            "/tmp/raw_audio/*",
            "/tmp/processed_dataset_*.pkl",
            "/tmp/dataset_metadata_*.json",
            "/tmp/trained_model_*.pt",
            "/tmp/training_history_*.json",
            "/tmp/model_info_*.json",
            "/tmp/best_model_*.pt",
            "/tmp/pipeline_config.yaml"
        ]
        
        cleaned_files = 0
        for pattern in temp_patterns:
            for file_path in glob.glob(pattern):
                try:
                    os.remove(file_path)
                    cleaned_files += 1
                except:
                    pass
        
        if cleaned_files > 0:
            logger.info(f"Cleaned up {cleaned_files} temporary files")
            
    except Exception as e:
        logger.warning(f"Failed to clean up temporary files: {e}")

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
    
    # Validate skip data processing arguments
    if args.skip_data_processing and not args.existing_dataset_path:
        logger.error("--existing-dataset-path is required when --skip-data-processing is used")
        sys.exit(1)
    
    # Generate pipeline ID if not provided
    if not args.pipeline_id:
        pipeline_id = f"complete-pipeline-{uuid.uuid4().hex[:8]}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    else:
        pipeline_id = args.pipeline_id
    
    logger.info(f"Pipeline ID: {pipeline_id}")
    
    try:
        # Load configuration
        config = load_configuration(args.config_path)
        
        # Update configuration with command line arguments
        config = update_config_with_args(config, args)
        
        # Print pipeline configuration
        print("\\n=== Complete Pipeline Configuration ===")
        print(f"Pipeline ID: {pipeline_id}")
        print(f"Skip Data Processing: {args.skip_data_processing}")
        if args.skip_data_processing:
            print(f"Existing Dataset: {args.existing_dataset_path}")
        print(f"Model Type: {config['training']['model_type']}")
        print(f"Epochs: {config['training']['epochs']}")
        print(f"Batch Size: {config['training']['batch_size']}")
        print(f"Learning Rate: {config['training']['learning_rate']}")
        print(f"Cleanup Temp Files: {args.cleanup_temp_files}")
        
        # Run complete pipeline
        result = run_complete_pipeline(pipeline_id, config, args)
        
        # Print results
        print("\\n=== Complete Pipeline Results ===")
        print(f"Pipeline ID: {result['pipeline_id']}")
        print(f"Dataset Path: {result['dataset_path']}")
        print(f"Model GCS Path: {result['model_gcs_path']}")
        print(f"Vertex AI Model: {result['vertex_model_name']}")
        print(f"Completion Time: {result['timestamp']}")
        
        print("\\nFinal Model Metrics:")
        for metric, value in result['final_metrics'].items():
            if isinstance(value, float):
                print(f"  {metric}: {value:.4f}")
            else:
                print(f"  {metric}: {value}")
        
        # Cleanup temporary files
        if args.cleanup_temp_files:
            cleanup_temp_files()
        
        logger.info("Complete pipeline executed successfully")
        
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        
        # Cleanup temporary files even on failure
        if args.cleanup_temp_files:
            cleanup_temp_files()
        
        sys.exit(1)

if __name__ == "__main__":
    main()