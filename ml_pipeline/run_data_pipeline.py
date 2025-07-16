#!/usr/bin/env python3
"""
Data Pipeline Execution Script
This script orchestrates the complete data processing pipeline.
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Run ML Data Processing Pipeline')
    
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

def run_data_pipeline(pipeline_id: str, config: dict) -> dict:
    """Run the complete data processing pipeline"""
    try:
        logger.info(f"Starting data processing pipeline: {pipeline_id}")
        
        # Initialize data processor
        processor = DataProcessor(config)
        
        # Run complete pipeline
        result = processor.run_complete_pipeline(pipeline_id)
        
        logger.info(f"Data processing pipeline completed successfully: {pipeline_id}")
        return {
            'pipeline_id': pipeline_id,
            'status': 'completed',
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Data processing pipeline failed: {e}")
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
    
    # Generate pipeline ID if not provided
    if not args.pipeline_id:
        pipeline_id = f"data-pipeline-{uuid.uuid4().hex[:8]}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    else:
        pipeline_id = args.pipeline_id
    
    logger.info(f"Pipeline ID: {pipeline_id}")
    
    try:
        # Load configuration
        config = load_configuration(args.config_path)
        
        # Initialize pipeline status
        gcp_config = GCPConfig()
        pipeline_status = PipelineStatus(gcp_config)
        
        # Update initial status
        pipeline_status.update_status(
            pipeline_id, "running", 0.0, "Data processing pipeline started"
        )
        
        # Run data pipeline
        result = run_data_pipeline(pipeline_id, config)
        
        # Print results
        print("\\n=== Pipeline Results ===")
        print(f"Pipeline ID: {result['pipeline_id']}")
        print(f"Status: {result['status']}")
        print(f"Timestamp: {result['timestamp']}")
        
        if result['status'] == 'completed':
            print(f"Result: {result['result']}")
            logger.info("Data processing pipeline completed successfully")
        else:
            print(f"Error: {result['error']}")
            logger.error("Data processing pipeline failed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()