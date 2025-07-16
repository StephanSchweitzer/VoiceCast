"""
Cloud Function: Trigger Training Pipeline
Manually trigger the ML model training pipeline via HTTP request
"""

import os
import json
import uuid
import logging
from datetime import datetime
from google.cloud import compute_v1
from google.cloud import storage
from google.cloud import pubsub_v1
import functions_framework

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
PROJECT_ID = os.environ.get('GCP_PROJECT_ID', '${project_id}')
REGION = os.environ.get('GCP_REGION', '${region}')
PROCESSED_DATA_BUCKET = os.environ.get('PROCESSED_DATA_BUCKET')
MODELS_BUCKET = os.environ.get('MODELS_BUCKET')
TEMP_BUCKET = os.environ.get('TEMP_BUCKET')

@functions_framework.http
def trigger_training_pipeline(request):
    """
    HTTP Cloud Function to trigger the model training pipeline
    
    Expected request body:
    {
        "dataset_path": "gs://bucket/path/to/dataset.pkl",
        "training_config": {
            "model_type": "transformer",
            "epochs": 50,
            "batch_size": 32,
            "learning_rate": 0.001
        }
    }
    """
    
    # Set CORS headers
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Validate request method
        if request.method != 'POST':
            return json.dumps({
                'error': 'Only POST method is allowed',
                'status': 'error'
            }), 405, headers
        
        # Parse request body
        request_json = request.get_json(silent=True)
        if not request_json:
            return json.dumps({
                'error': 'Request body is required',
                'status': 'error'
            }), 400, headers
        
        # Validate required fields
        dataset_path = request_json.get('dataset_path')
        if not dataset_path:
            return json.dumps({
                'error': 'dataset_path is required',
                'status': 'error'
            }), 400, headers
        
        # Validate dataset path format
        if not dataset_path.startswith('gs://'):
            return json.dumps({
                'error': 'dataset_path must be a GCS path (gs://...)',
                'status': 'error'
            }), 400, headers
        
        # Generate pipeline ID
        pipeline_id = f"training-pipeline-{uuid.uuid4().hex[:8]}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Validate dataset exists
        storage_client = storage.Client()
        if not dataset_exists(storage_client, dataset_path):
            return json.dumps({
                'error': f'Dataset not found: {dataset_path}',
                'status': 'error',
                'pipeline_id': pipeline_id
            }), 400, headers
        
        # Create training configuration
        training_config = {
            'pipeline_id': pipeline_id,
            'timestamp': datetime.now().isoformat(),
            'dataset_path': dataset_path,
            'bucket_config': {
                'processed_data': PROCESSED_DATA_BUCKET,
                'models': MODELS_BUCKET,
                'temp': TEMP_BUCKET
            },
            'training': request_json.get('training_config', {
                'model_type': 'mlp',
                'epochs': 50,
                'batch_size': 32,
                'learning_rate': 0.001,
                'early_stopping': {
                    'patience': 10,
                    'monitor': 'val_loss'
                }
            }),
            'infrastructure': {
                'machine_type': 'n1-standard-4',
                'accelerator_type': 'NVIDIA_TESLA_T4',
                'accelerator_count': 1,
                'preemptible': True
            },
            'project_id': PROJECT_ID,
            'region': REGION
        }
        
        # Create compute instance for training
        instance_name = f"training-pipeline-{pipeline_id}"
        instance_created = create_training_instance(
            instance_name, 
            pipeline_id, 
            dataset_path,
            training_config
        )
        
        if not instance_created:
            return json.dumps({
                'error': 'Failed to create training instance',
                'status': 'error',
                'pipeline_id': pipeline_id
            }), 500, headers
        
        # Publish pipeline event
        publish_pipeline_event('training_pipeline_triggered', pipeline_id, training_config)
        
        # Return success response
        response = {
            'status': 'success',
            'message': 'Training pipeline triggered successfully',
            'pipeline_id': pipeline_id,
            'instance_name': instance_name,
            'dataset_path': dataset_path,
            'config': training_config,
            'estimated_duration': estimate_training_duration(training_config)
        }
        
        logger.info(f"Training pipeline triggered: {pipeline_id}")
        return json.dumps(response), 200, headers
        
    except Exception as e:
        logger.error(f"Error triggering training pipeline: {e}")
        return json.dumps({
            'error': f'Failed to trigger training pipeline: {str(e)}',
            'status': 'error'
        }), 500, headers

def dataset_exists(storage_client, dataset_path):
    """Check if dataset exists in GCS"""
    try:
        # Parse GCS path
        if not dataset_path.startswith('gs://'):
            return False
        
        path_parts = dataset_path.replace('gs://', '').split('/', 1)
        bucket_name = path_parts[0]
        blob_name = path_parts[1] if len(path_parts) > 1 else ''
        
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        
        return blob.exists()
        
    except Exception as e:
        logger.error(f"Error checking dataset existence: {e}")
        return False

def create_training_instance(instance_name, pipeline_id, dataset_path, config):
    """Create a compute instance for training"""
    try:
        compute_client = compute_v1.InstancesClient()
        
        # Define startup script
        startup_script = f"""#!/bin/bash
# Update system
apt-get update
apt-get install -y python3-pip git

# Install Python dependencies
pip3 install google-cloud-storage google-cloud-aiplatform
pip3 install torch torchaudio transformers datasets

# Download ML pipeline code
gsutil cp -r gs://{MODELS_BUCKET}/ml_pipeline/ /opt/ml_pipeline/

# Set environment variables
export GCP_PROJECT_ID={PROJECT_ID}
export GCP_REGION={REGION}
export PIPELINE_ID={pipeline_id}

# Run training pipeline
cd /opt/ml_pipeline
python3 run_train_pipeline.py \\
  --dataset-path {dataset_path} \\
  --pipeline-id {pipeline_id} \\
  --model-type {config['training']['model_type']} \\
  --epochs {config['training']['epochs']} \\
  --batch-size {config['training']['batch_size']} \\
  --learning-rate {config['training']['learning_rate']}

# Clean up and shutdown
shutdown -h now
"""
        
        # Determine machine type and GPU configuration
        training_config = config.get('training', {})
        use_gpu = training_config.get('model_type') == 'transformer'
        
        # Instance configuration
        instance_config = {
            'name': instance_name,
            'machine_type': f'zones/{REGION}-a/machineTypes/n1-standard-4',
            'disks': [
                {
                    'boot': True,
                    'auto_delete': True,
                    'initialize_params': {
                        'source_image': 'projects/ml-images/global/images/family/tf-2-11-gpu-ubuntu-2004' if use_gpu else 'projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts',
                        'disk_size_gb': 100,
                        'disk_type': f'projects/{PROJECT_ID}/zones/{REGION}-a/diskTypes/pd-ssd'
                    }
                }
            ],
            'network_interfaces': [
                {
                    'network': 'global/networks/default',
                    'access_configs': [
                        {
                            'type': 'ONE_TO_ONE_NAT',
                            'name': 'External NAT'
                        }
                    ]
                }
            ],
            'metadata': {
                'items': [
                    {
                        'key': 'startup-script',
                        'value': startup_script
                    }
                ]
            },
            'service_accounts': [
                {
                    'email': f'voicecast-ml-pipeline@{PROJECT_ID}.iam.gserviceaccount.com',
                    'scopes': [
                        'https://www.googleapis.com/auth/cloud-platform'
                    ]
                }
            ],
            'scheduling': {
                'preemptible': True  # Use preemptible instances for cost optimization
            },
            'labels': {
                'pipeline-id': pipeline_id.replace('_', '-'),
                'type': 'training',
                'project': 'voicecast'
            }
        }
        
        # Add GPU if needed
        if use_gpu:
            instance_config['guest_accelerators'] = [
                {
                    'accelerator_type': f'projects/{PROJECT_ID}/zones/{REGION}-a/acceleratorTypes/nvidia-tesla-t4',
                    'accelerator_count': 1
                }
            ]
        
        # Create instance
        request = compute_v1.InsertInstanceRequest(
            project=PROJECT_ID,
            zone=f'{REGION}-a',
            instance_resource=instance_config
        )
        
        operation = compute_client.insert(request=request)
        
        logger.info(f"Created training instance: {instance_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating training instance: {e}")
        return False

def publish_pipeline_event(event_type, pipeline_id, data):
    """Publish pipeline event to Pub/Sub"""
    try:
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(PROJECT_ID, 'voicecast-ml-pipeline-events')
        
        message_data = {
            'event_type': event_type,
            'pipeline_id': pipeline_id,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        
        message = json.dumps(message_data).encode('utf-8')
        future = publisher.publish(topic_path, message)
        future.result()
        
        logger.info(f"Published pipeline event: {event_type}")
        
    except Exception as e:
        logger.error(f"Error publishing pipeline event: {e}")

def estimate_training_duration(config):
    """Estimate training duration based on configuration"""
    training_config = config.get('training', {})
    
    # Base estimates (in minutes)
    base_time = 10  # Setup time
    
    # Estimate per epoch
    model_type = training_config.get('model_type', 'mlp')
    epochs = training_config.get('epochs', 50)
    batch_size = training_config.get('batch_size', 32)
    
    if model_type == 'transformer':
        per_epoch_time = 3  # minutes for transformer
    else:
        per_epoch_time = 1  # minutes for MLP
    
    # Adjust for batch size
    batch_factor = 32 / batch_size  # Baseline is 32
    per_epoch_time *= batch_factor
    
    estimated_minutes = base_time + (epochs * per_epoch_time)
    
    return {
        'estimated_minutes': estimated_minutes,
        'estimated_hours': round(estimated_minutes / 60, 2),
        'epochs': epochs,
        'model_type': model_type
    }