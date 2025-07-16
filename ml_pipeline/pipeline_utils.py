"""
Utility functions for GCP integration in the ML pipeline.
This module provides common functionality for:
- GCS bucket operations
- Vertex AI model management
- Cloud Functions integration
- Authentication and credentials management
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from google.cloud import storage
from google.cloud import aiplatform
from google.cloud import functions_v1
from google.auth import default
import yaml

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GCPConfig:
    """Configuration management for GCP resources"""
    
    def __init__(self):
        self.project_id = os.environ.get('GCP_PROJECT_ID', 'voicecast-464815')
        self.region = os.environ.get('GCP_REGION', 'europe-west1')
        self.credentials, self.project = default()
        
        # Initialize clients
        self.storage_client = storage.Client(credentials=self.credentials, project=self.project_id)
        aiplatform.init(project=self.project_id, location=self.region, credentials=self.credentials)
        
        # ML Pipeline buckets
        self.buckets = {
            'raw_data': f'{self.project_id}-ml-pipeline-raw-data',
            'processed_data': f'{self.project_id}-ml-pipeline-processed-data',
            'models': f'{self.project_id}-ml-pipeline-models'
        }
        
        logger.info(f"GCP Config initialized for project: {self.project_id}, region: {self.region}")

class StorageManager:
    """Manages GCS bucket operations for ML pipeline"""
    
    def __init__(self, config: GCPConfig):
        self.config = config
        self.client = config.storage_client
        
    def upload_file(self, bucket_name: str, source_file_path: str, destination_blob_name: str) -> str:
        """Upload a file to GCS bucket"""
        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(destination_blob_name)
            blob.upload_from_filename(source_file_path)
            logger.info(f"File {source_file_path} uploaded to {bucket_name}/{destination_blob_name}")
            return f"gs://{bucket_name}/{destination_blob_name}"
        except Exception as e:
            logger.error(f"Failed to upload file to GCS: {e}")
            raise
    
    def download_file(self, bucket_name: str, source_blob_name: str, destination_file_path: str) -> str:
        """Download a file from GCS bucket"""
        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(source_blob_name)
            blob.download_to_filename(destination_file_path)
            logger.info(f"File {source_blob_name} downloaded from {bucket_name} to {destination_file_path}")
            return destination_file_path
        except Exception as e:
            logger.error(f"Failed to download file from GCS: {e}")
            raise
    
    def list_files(self, bucket_name: str, prefix: str = "") -> List[str]:
        """List files in GCS bucket with optional prefix"""
        try:
            bucket = self.client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=prefix)
            files = [blob.name for blob in blobs]
            logger.info(f"Found {len(files)} files in {bucket_name} with prefix '{prefix}'")
            return files
        except Exception as e:
            logger.error(f"Failed to list files in GCS: {e}")
            raise
    
    def delete_file(self, bucket_name: str, blob_name: str) -> bool:
        """Delete a file from GCS bucket"""
        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            blob.delete()
            logger.info(f"File {blob_name} deleted from {bucket_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file from GCS: {e}")
            return False

class VertexAIManager:
    """Manages Vertex AI operations for model training and deployment"""
    
    def __init__(self, config: GCPConfig):
        self.config = config
        self.project_id = config.project_id
        self.region = config.region
        
    def create_custom_job(self, 
                         display_name: str,
                         script_path: str,
                         container_uri: str,
                         machine_type: str = "n1-standard-4",
                         accelerator_type: str = "NVIDIA_TESLA_T4",
                         accelerator_count: int = 1,
                         preemptible: bool = True) -> str:
        """Create a custom training job on Vertex AI"""
        try:
            # Configure worker pool
            worker_pool_spec = {
                "machine_spec": {
                    "machine_type": machine_type,
                    "accelerator_type": accelerator_type,
                    "accelerator_count": accelerator_count,
                },
                "replica_count": 1,
                "container_spec": {
                    "image_uri": container_uri,
                    "command": ["python", script_path],
                },
            }
            
            # Create custom job
            job = aiplatform.CustomJob(
                display_name=display_name,
                worker_pool_specs=[worker_pool_spec],
                staging_bucket=f"gs://{self.config.buckets['models']}",
                # Use preemptible instances for cost optimization
                base_output_dir=f"gs://{self.config.buckets['models']}/training_outputs",
            )
            
            logger.info(f"Created custom job: {display_name}")
            return job.resource_name
        except Exception as e:
            logger.error(f"Failed to create custom job: {e}")
            raise
    
    def upload_model(self, 
                    display_name: str,
                    artifact_uri: str,
                    serving_container_image_uri: str,
                    description: str = "") -> str:
        """Upload model to Vertex AI Model Registry"""
        try:
            model = aiplatform.Model.upload(
                display_name=display_name,
                artifact_uri=artifact_uri,
                serving_container_image_uri=serving_container_image_uri,
                description=description,
            )
            logger.info(f"Model uploaded to registry: {display_name}")
            return model.resource_name
        except Exception as e:
            logger.error(f"Failed to upload model: {e}")
            raise
    
    def list_models(self) -> List[Dict[str, Any]]:
        """List all models in Vertex AI Model Registry"""
        try:
            models = aiplatform.Model.list()
            model_info = []
            for model in models:
                model_info.append({
                    'name': model.display_name,
                    'resource_name': model.resource_name,
                    'create_time': model.create_time,
                    'update_time': model.update_time,
                    'description': model.description or "",
                })
            logger.info(f"Found {len(model_info)} models in registry")
            return model_info
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            raise

class PipelineStatus:
    """Manages pipeline execution status and progress tracking"""
    
    def __init__(self, config: GCPConfig):
        self.config = config
        self.storage_manager = StorageManager(config)
        self.status_bucket = config.buckets['models']
        self.status_prefix = "pipeline_status/"
    
    def update_status(self, pipeline_id: str, status: str, progress: float = 0.0, 
                     message: str = "", metadata: Dict[str, Any] = None) -> bool:
        """Update pipeline status"""
        try:
            status_data = {
                'pipeline_id': pipeline_id,
                'status': status,  # 'running', 'completed', 'failed', 'cancelled'
                'progress': progress,  # 0.0 to 1.0
                'message': message,
                'timestamp': str(aiplatform.utils.timestamp_now()),
                'metadata': metadata or {}
            }
            
            # Save status to GCS
            status_file = f"/tmp/status_{pipeline_id}.json"
            with open(status_file, 'w') as f:
                json.dump(status_data, f, indent=2)
            
            blob_name = f"{self.status_prefix}{pipeline_id}.json"
            self.storage_manager.upload_file(self.status_bucket, status_file, blob_name)
            
            # Clean up temp file
            os.remove(status_file)
            
            logger.info(f"Updated status for pipeline {pipeline_id}: {status} ({progress*100:.1f}%)")
            return True
        except Exception as e:
            logger.error(f"Failed to update pipeline status: {e}")
            return False
    
    def get_status(self, pipeline_id: str) -> Optional[Dict[str, Any]]:
        """Get pipeline status"""
        try:
            blob_name = f"{self.status_prefix}{pipeline_id}.json"
            status_file = f"/tmp/status_{pipeline_id}.json"
            
            self.storage_manager.download_file(self.status_bucket, blob_name, status_file)
            
            with open(status_file, 'r') as f:
                status_data = json.load(f)
            
            # Clean up temp file
            os.remove(status_file)
            
            return status_data
        except Exception as e:
            logger.error(f"Failed to get pipeline status: {e}")
            return None
    
    def list_pipelines(self) -> List[Dict[str, Any]]:
        """List all pipeline statuses"""
        try:
            status_files = self.storage_manager.list_files(self.status_bucket, self.status_prefix)
            pipelines = []
            
            for file_name in status_files:
                if file_name.endswith('.json'):
                    pipeline_id = file_name.replace(self.status_prefix, '').replace('.json', '')
                    status = self.get_status(pipeline_id)
                    if status:
                        pipelines.append(status)
            
            return pipelines
        except Exception as e:
            logger.error(f"Failed to list pipelines: {e}")
            return []

def create_pipeline_config(config_path: str = "/tmp/pipeline_config.yaml") -> Dict[str, Any]:
    """Create default pipeline configuration"""
    default_config = {
        'data_processing': {
            'batch_size': 32,
            'sample_rate': 22050,
            'max_duration': 30.0,
            'min_duration': 1.0,
            'normalization': True,
            'augmentation': {
                'noise_injection': True,
                'pitch_shifting': True,
                'time_stretching': True
            }
        },
        'training': {
            'model_type': 'transformer',
            'epochs': 100,
            'learning_rate': 0.001,
            'batch_size': 16,
            'validation_split': 0.2,
            'early_stopping': {
                'patience': 10,
                'monitor': 'val_loss'
            },
            'checkpointing': {
                'save_best_only': True,
                'save_frequency': 5
            }
        },
        'infrastructure': {
            'machine_type': 'n1-standard-4',
            'accelerator_type': 'NVIDIA_TESLA_T4',
            'accelerator_count': 1,
            'preemptible': True,
            'max_runtime_hours': 8
        }
    }
    
    with open(config_path, 'w') as f:
        yaml.dump(default_config, f, default_flow_style=False)
    
    return default_config

def validate_gcp_setup() -> Dict[str, bool]:
    """Validate GCP setup and permissions"""
    validation_results = {}
    
    try:
        config = GCPConfig()
        storage_manager = StorageManager(config)
        
        # Test storage access
        for bucket_name, bucket in config.buckets.items():
            try:
                storage_manager.client.bucket(bucket).exists()
                validation_results[f'bucket_{bucket_name}'] = True
            except Exception as e:
                logger.error(f"Bucket {bucket} validation failed: {e}")
                validation_results[f'bucket_{bucket_name}'] = False
        
        # Test Vertex AI access
        try:
            aiplatform.Model.list(limit=1)
            validation_results['vertex_ai'] = True
        except Exception as e:
            logger.error(f"Vertex AI validation failed: {e}")
            validation_results['vertex_ai'] = False
        
        logger.info(f"GCP validation results: {validation_results}")
        return validation_results
        
    except Exception as e:
        logger.error(f"GCP validation failed: {e}")
        return {'error': str(e)}