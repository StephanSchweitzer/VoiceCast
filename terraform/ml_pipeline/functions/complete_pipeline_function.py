"""
Cloud Function: Trigger Complete Pipeline
Manually trigger the complete end-to-end ML pipeline via HTTP request
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
RAW_DATA_BUCKET = os.environ.get('RAW_DATA_BUCKET')
PROCESSED_DATA_BUCKET = os.environ.get('PROCESSED_DATA_BUCKET')
MODELS_BUCKET = os.environ.get('MODELS_BUCKET')
TEMP_BUCKET = os.environ.get('TEMP_BUCKET')

@functions_framework.http
def trigger_complete_pipeline(request):
    """
    HTTP Cloud Function to trigger the complete end-to-end ML pipeline
    
    Expected request body:
    {
        "pipeline_config": {
            "data_processing": {
                "batch_size": 32,
                "sample_rate": 22050,
                "augmentation": {"enabled": true}
            },
            "training": {
                "model_type": "transformer",
                "epochs": 50,
                "batch_size": 32,
                "learning_rate": 0.001
            }
        },
        "skip_data_processing": false,
        "existing_dataset_path": "gs://bucket/path/to/dataset.pkl"
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
            request_json = {}
        
        # Generate pipeline ID
        pipeline_id = f"complete-pipeline-{uuid.uuid4().hex[:8]}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Check if we should skip data processing
        skip_data_processing = request_json.get('skip_data_processing', False)
        existing_dataset_path = request_json.get('existing_dataset_path')
        
        # Validate storage buckets
        storage_client = storage.Client()
        
        if not skip_data_processing:
            # Validate raw data bucket has files
            raw_files = list_audio_files(storage_client, RAW_DATA_BUCKET)
            if not raw_files:
                return json.dumps({
                    'error': 'No audio files found in raw data bucket',
                    'status': 'error',
                    'pipeline_id': pipeline_id,
                    'bucket': RAW_DATA_BUCKET
                }), 400, headers
        else:
            # Validate existing dataset path
            if not existing_dataset_path:
                return json.dumps({
                    'error': 'existing_dataset_path is required when skip_data_processing is true',
                    'status': 'error',
                    'pipeline_id': pipeline_id
                }), 400, headers
            
            if not dataset_exists(storage_client, existing_dataset_path):
                return json.dumps({
                    'error': f'Dataset not found: {existing_dataset_path}',
                    'status': 'error',
                    'pipeline_id': pipeline_id
                }), 400, headers
        
        # Create complete pipeline configuration
        pipeline_config = {
            'pipeline_id': pipeline_id,
            'timestamp': datetime.now().isoformat(),
            'skip_data_processing': skip_data_processing,
            'existing_dataset_path': existing_dataset_path,
            'bucket_config': {
                'raw_data': RAW_DATA_BUCKET,
                'processed_data': PROCESSED_DATA_BUCKET,
                'models': MODELS_BUCKET,
                'temp': TEMP_BUCKET
            },
            'data_processing': request_json.get('pipeline_config', {}).get('data_processing', {
                'batch_size': 32,
                'sample_rate': 22050,
                'max_duration': 30.0,
                'min_duration': 1.0,
                'normalization': True,
                'augmentation': {
                    'enabled': True,
                    'noise_injection': True,
                    'pitch_shifting': True,
                    'time_stretching': True
                }
            }),
            'training': request_json.get('pipeline_config', {}).get('training', {
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
        
        # Create compute instance for complete pipeline
        instance_name = f"complete-pipeline-{pipeline_id}"
        instance_created = create_complete_pipeline_instance(
            instance_name, 
            pipeline_id, 
            pipeline_config
        )
        
        if not instance_created:
            return json.dumps({
                'error': 'Failed to create complete pipeline instance',
                'status': 'error',
                'pipeline_id': pipeline_id
            }), 500, headers
        
        # Publish pipeline event
        publish_pipeline_event('complete_pipeline_triggered', pipeline_id, pipeline_config)
        
        # Estimate duration
        estimated_duration = estimate_complete_pipeline_duration(pipeline_config)
        
        # Return success response
        response = {
            'status': 'success',
            'message': 'Complete ML pipeline triggered successfully',
            'pipeline_id': pipeline_id,
            'instance_name': instance_name,
            'config': pipeline_config,
            'estimated_duration': estimated_duration,
            'phases': {
                'data_processing': not skip_data_processing,
                'training': True,
                'model_deployment': True
            }
        }
        
        logger.info(f"Complete pipeline triggered: {pipeline_id}")
        return json.dumps(response), 200, headers
        
    except Exception as e:
        logger.error(f"Error triggering complete pipeline: {e}")
        return json.dumps({
            'error': f'Failed to trigger complete pipeline: {str(e)}',
            'status': 'error'
        }), 500, headers

def list_audio_files(storage_client, bucket_name):
    """List audio files in a bucket"""
    try:
        bucket = storage_client.bucket(bucket_name)
        blobs = bucket.list_blobs()
        
        audio_extensions = ['.wav', '.mp3', '.flac', '.m4a', '.ogg']
        audio_files = []
        
        for blob in blobs:
            if any(blob.name.lower().endswith(ext) for ext in audio_extensions):
                audio_files.append(blob.name)
        
        return audio_files
    except Exception as e:
        logger.error(f"Error listing audio files: {e}")
        return []

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

def create_complete_pipeline_instance(instance_name, pipeline_id, config):
    """Create a compute instance for complete pipeline"""
    try:
        compute_client = compute_v1.InstancesClient()
        
        # Create configuration arguments
        skip_data_processing = config.get('skip_data_processing', False)
        existing_dataset_path = config.get('existing_dataset_path', '')
        
        # Define startup script
        startup_script = f"""#!/bin/bash
# Update system
apt-get update
apt-get install -y python3-pip git ffmpeg

# Install Python dependencies
pip3 install google-cloud-storage google-cloud-aiplatform
pip3 install torch torchaudio transformers datasets librosa soundfile

# Download ML pipeline code
gsutil cp -r gs://{MODELS_BUCKET}/ml_pipeline/ /opt/ml_pipeline/

# Set environment variables
export GCP_PROJECT_ID={PROJECT_ID}
export GCP_REGION={REGION}
export PIPELINE_ID={pipeline_id}

# Create pipeline arguments
PIPELINE_ARGS="--pipeline-id {pipeline_id}"
if [ "{skip_data_processing}" = "True" ]; then
    PIPELINE_ARGS="$PIPELINE_ARGS --skip-data-processing"
    if [ "{existing_dataset_path}" != "" ]; then
        PIPELINE_ARGS="$PIPELINE_ARGS --existing-dataset-path {existing_dataset_path}"
    fi
fi

# Add training configuration
PIPELINE_ARGS="$PIPELINE_ARGS --model-type {config['training']['model_type']}"
PIPELINE_ARGS="$PIPELINE_ARGS --epochs {config['training']['epochs']}"
PIPELINE_ARGS="$PIPELINE_ARGS --batch-size {config['training']['batch_size']}"
PIPELINE_ARGS="$PIPELINE_ARGS --learning-rate {config['training']['learning_rate']}"

# Run complete pipeline
cd /opt/ml_pipeline
python3 run_complete_pipeline.py $PIPELINE_ARGS

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
                'type': 'complete-pipeline',
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
        
        logger.info(f"Created complete pipeline instance: {instance_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating complete pipeline instance: {e}")
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

def estimate_complete_pipeline_duration(config):
    """Estimate complete pipeline duration"""
    # Data processing estimate
    if config.get('skip_data_processing', False):
        data_processing_minutes = 0
    else:
        data_processing_minutes = 30  # Estimated data processing time
    
    # Training estimate
    training_config = config.get('training', {})
    model_type = training_config.get('model_type', 'mlp')
    epochs = training_config.get('epochs', 50)
    batch_size = training_config.get('batch_size', 32)
    
    if model_type == 'transformer':
        per_epoch_time = 3  # minutes for transformer
    else:
        per_epoch_time = 1  # minutes for MLP
    
    # Adjust for batch size
    batch_factor = 32 / batch_size
    per_epoch_time *= batch_factor
    
    training_minutes = 10 + (epochs * per_epoch_time)  # 10 minutes setup
    
    # Model deployment estimate
    deployment_minutes = 5
    
    total_minutes = data_processing_minutes + training_minutes + deployment_minutes
    
    return {
        'total_minutes': total_minutes,
        'total_hours': round(total_minutes / 60, 2),
        'phases': {
            'data_processing_minutes': data_processing_minutes,
            'training_minutes': training_minutes,
            'deployment_minutes': deployment_minutes
        },
        'config': {
            'skip_data_processing': config.get('skip_data_processing', False),
            'epochs': epochs,
            'model_type': model_type
        }
    }