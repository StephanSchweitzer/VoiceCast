"""
Cloud Function: Trigger Data Pipeline
Manually trigger the ML data processing pipeline via HTTP request
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
def trigger_data_pipeline(request):
    """
    HTTP Cloud Function to trigger the data processing pipeline
    
    Expected request body:
    {
        "pipeline_config": {
            "batch_size": 32,
            "sample_rate": 22050,
            "augmentation_enabled": true
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
            request_json = {}
        
        # Generate pipeline ID
        pipeline_id = f"data-pipeline-{uuid.uuid4().hex[:8]}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Validate bucket existence
        storage_client = storage.Client()
        
        if not bucket_exists(storage_client, RAW_DATA_BUCKET):
            return json.dumps({
                'error': f'Raw data bucket {RAW_DATA_BUCKET} does not exist',
                'status': 'error',
                'pipeline_id': pipeline_id
            }), 400, headers
        
        # Check if raw data bucket has files
        raw_files = list_audio_files(storage_client, RAW_DATA_BUCKET)
        if not raw_files:
            return json.dumps({
                'error': 'No audio files found in raw data bucket',
                'status': 'error',
                'pipeline_id': pipeline_id,
                'bucket': RAW_DATA_BUCKET
            }), 400, headers
        
        # Create pipeline configuration
        pipeline_config = {
            'pipeline_id': pipeline_id,
            'timestamp': datetime.now().isoformat(),
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
            'file_count': len(raw_files),
            'project_id': PROJECT_ID,
            'region': REGION
        }
        
        # Create compute instance for data processing
        instance_name = f"data-pipeline-{pipeline_id}"
        instance_created = create_data_processing_instance(
            instance_name, 
            pipeline_id, 
            pipeline_config
        )
        
        if not instance_created:
            return json.dumps({
                'error': 'Failed to create data processing instance',
                'status': 'error',
                'pipeline_id': pipeline_id
            }), 500, headers
        
        # Publish pipeline event
        publish_pipeline_event('data_pipeline_triggered', pipeline_id, pipeline_config)
        
        # Return success response
        response = {
            'status': 'success',
            'message': 'Data processing pipeline triggered successfully',
            'pipeline_id': pipeline_id,
            'instance_name': instance_name,
            'config': pipeline_config,
            'estimated_duration': estimate_processing_duration(len(raw_files))
        }
        
        logger.info(f"Data pipeline triggered: {pipeline_id}")
        return json.dumps(response), 200, headers
        
    except Exception as e:
        logger.error(f"Error triggering data pipeline: {e}")
        return json.dumps({
            'error': f'Failed to trigger data pipeline: {str(e)}',
            'status': 'error'
        }), 500, headers

def bucket_exists(storage_client, bucket_name):
    """Check if a bucket exists"""
    try:
        storage_client.bucket(bucket_name).exists()
        return True
    except Exception:
        return False

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

def create_data_processing_instance(instance_name, pipeline_id, config):
    """Create a compute instance for data processing"""
    try:
        compute_client = compute_v1.InstancesClient()
        
        # Define startup script
        startup_script = f"""#!/bin/bash
# Update system
apt-get update
apt-get install -y python3-pip git

# Install Python dependencies
pip3 install google-cloud-storage google-cloud-aiplatform

# Download ML pipeline code
gsutil cp -r gs://{MODELS_BUCKET}/ml_pipeline/ /opt/ml_pipeline/

# Set environment variables
export GCP_PROJECT_ID={PROJECT_ID}
export GCP_REGION={REGION}
export PIPELINE_ID={pipeline_id}

# Run data processing pipeline
cd /opt/ml_pipeline
python3 run_data_pipeline.py --pipeline-id {pipeline_id}

# Clean up and shutdown
shutdown -h now
"""
        
        # Instance configuration
        instance_config = {
            'name': instance_name,
            'machine_type': f'zones/{REGION}-a/machineTypes/n1-standard-4',
            'disks': [
                {
                    'boot': True,
                    'auto_delete': True,
                    'initialize_params': {
                        'source_image': 'projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts',
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
                'type': 'data-processing',
                'project': 'voicecast'
            }
        }
        
        # Create instance
        request = compute_v1.InsertInstanceRequest(
            project=PROJECT_ID,
            zone=f'{REGION}-a',
            instance_resource=instance_config
        )
        
        operation = compute_client.insert(request=request)
        
        logger.info(f"Created data processing instance: {instance_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating instance: {e}")
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

def estimate_processing_duration(file_count):
    """Estimate processing duration based on file count"""
    # Rough estimate: 2 minutes per file + base overhead
    base_time = 5  # minutes
    per_file_time = 2  # minutes
    
    estimated_minutes = base_time + (file_count * per_file_time)
    
    return {
        'estimated_minutes': estimated_minutes,
        'estimated_hours': round(estimated_minutes / 60, 2),
        'file_count': file_count
    }