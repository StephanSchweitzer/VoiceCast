"""
Cloud Function: Pipeline Status
Get the status and progress of ML pipeline executions
"""

import os
import json
import logging
from datetime import datetime
from google.cloud import storage
from google.cloud import aiplatform
import functions_framework

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
PROJECT_ID = os.environ.get('GCP_PROJECT_ID', '${project_id}')
REGION = os.environ.get('GCP_REGION', '${region}')
MODELS_BUCKET = os.environ.get('MODELS_BUCKET')

@functions_framework.http
def get_pipeline_status(request):
    """
    HTTP Cloud Function to get pipeline status
    
    Query parameters:
    - pipeline_id: ID of the pipeline to check
    - format: Response format (json, summary) - default: json
    """
    
    # Set CORS headers
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
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
        if request.method != 'GET':
            return json.dumps({
                'error': 'Only GET method is allowed',
                'status': 'error'
            }), 405, headers
        
        # Get query parameters
        pipeline_id = request.args.get('pipeline_id')
        response_format = request.args.get('format', 'json')
        
        if not pipeline_id:
            # Return list of all pipelines if no specific ID provided
            return get_all_pipelines_status(response_format, headers)
        
        # Get specific pipeline status
        pipeline_status = get_pipeline_status_from_storage(pipeline_id)
        
        if not pipeline_status:
            return json.dumps({
                'error': f'Pipeline {pipeline_id} not found',
                'status': 'error',
                'pipeline_id': pipeline_id
            }), 404, headers
        
        # Format response based on request
        if response_format == 'summary':
            response = format_status_summary(pipeline_status)
        else:
            response = {
                'status': 'success',
                'pipeline_status': pipeline_status,
                'timestamp': datetime.now().isoformat()
            }
        
        logger.info(f"Pipeline status retrieved: {pipeline_id}")
        return json.dumps(response), 200, headers
        
    except Exception as e:
        logger.error(f"Error getting pipeline status: {e}")
        return json.dumps({
            'error': f'Failed to get pipeline status: {str(e)}',
            'status': 'error'
        }), 500, headers

def get_pipeline_status_from_storage(pipeline_id):
    """Get pipeline status from GCS"""
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(MODELS_BUCKET)
        
        # Try to get status file
        status_blob_name = f"pipeline_status/{pipeline_id}.json"
        try:
            blob = bucket.blob(status_blob_name)
            status_data = json.loads(blob.download_as_text())
            return status_data
        except Exception:
            # Status file not found, return None
            return None
            
    except Exception as e:
        logger.error(f"Error getting pipeline status from storage: {e}")
        return None

def get_all_pipelines_status(response_format, headers):
    """Get status of all pipelines"""
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(MODELS_BUCKET)
        
        # List all status files
        status_prefix = "pipeline_status/"
        blobs = bucket.list_blobs(prefix=status_prefix)
        
        pipelines = []
        for blob in blobs:
            if blob.name.endswith('.json'):
                try:
                    status_data = json.loads(blob.download_as_text())
                    pipelines.append(status_data)
                except Exception as e:
                    logger.warning(f"Failed to parse status file {blob.name}: {e}")
        
        # Sort by timestamp (newest first)
        pipelines.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        if response_format == 'summary':
            response = format_all_pipelines_summary(pipelines)
        else:
            response = {
                'status': 'success',
                'pipelines': pipelines,
                'total_count': len(pipelines),
                'timestamp': datetime.now().isoformat()
            }
        
        return json.dumps(response), 200, headers
        
    except Exception as e:
        logger.error(f"Error getting all pipelines status: {e}")
        return json.dumps({
            'error': f'Failed to get pipelines status: {str(e)}',
            'status': 'error'
        }), 500, headers

def format_status_summary(pipeline_status):
    """Format pipeline status as a summary"""
    status = pipeline_status.get('status', 'unknown')
    progress = pipeline_status.get('progress', 0.0)
    message = pipeline_status.get('message', '')
    
    # Status emoji mapping
    status_emojis = {
        'running': '🔄',
        'completed': '✅',
        'failed': '❌',
        'cancelled': '⏹️',
        'pending': '⏳'
    }
    
    emoji = status_emojis.get(status, '❓')
    
    return {
        'pipeline_id': pipeline_status.get('pipeline_id'),
        'status': status,
        'status_display': f"{emoji} {status.upper()}",
        'progress': f"{progress * 100:.1f}%",
        'message': message,
        'timestamp': pipeline_status.get('timestamp'),
        'duration': calculate_duration(pipeline_status),
        'metadata': pipeline_status.get('metadata', {})
    }

def format_all_pipelines_summary(pipelines):
    """Format all pipelines status as a summary"""
    summary = {
        'total_pipelines': len(pipelines),
        'status_counts': {},
        'recent_pipelines': [],
        'timestamp': datetime.now().isoformat()
    }
    
    # Count by status
    for pipeline in pipelines:
        status = pipeline.get('status', 'unknown')
        summary['status_counts'][status] = summary['status_counts'].get(status, 0) + 1
    
    # Recent pipelines (last 5)
    for pipeline in pipelines[:5]:
        summary['recent_pipelines'].append(format_status_summary(pipeline))
    
    return summary

def calculate_duration(pipeline_status):
    """Calculate pipeline duration"""
    try:
        timestamp = pipeline_status.get('timestamp')
        if not timestamp:
            return None
        
        # Parse timestamp
        start_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        current_time = datetime.now(start_time.tzinfo)
        
        duration = current_time - start_time
        
        # Format duration
        total_seconds = int(duration.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
            
    except Exception as e:
        logger.warning(f"Error calculating duration: {e}")
        return None

def get_vertex_ai_job_status(pipeline_id):
    """Get Vertex AI job status (if available)"""
    try:
        aiplatform.init(project=PROJECT_ID, location=REGION)
        
        # List custom jobs
        jobs = aiplatform.CustomJob.list(
            filter=f'display_name="{pipeline_id}"',
            order_by="create_time desc"
        )
        
        if jobs:
            job = jobs[0]
            return {
                'job_name': job.display_name,
                'state': job.state.name,
                'create_time': job.create_time.isoformat(),
                'start_time': job.start_time.isoformat() if job.start_time else None,
                'end_time': job.end_time.isoformat() if job.end_time else None,
                'error': job.error.message if job.error else None
            }
        
        return None
        
    except Exception as e:
        logger.warning(f"Error getting Vertex AI job status: {e}")
        return None