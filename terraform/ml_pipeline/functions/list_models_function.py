"""
Cloud Function: List Models
List all available trained models in the ML pipeline
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
def list_models(request):
    """
    HTTP Cloud Function to list available ML models
    
    Query parameters:
    - format: Response format (json, summary, table) - default: json
    - limit: Maximum number of models to return - default: 50
    - sort: Sort order (newest, oldest, name) - default: newest
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
        response_format = request.args.get('format', 'json')
        limit = int(request.args.get('limit', 50))
        sort_order = request.args.get('sort', 'newest')
        
        # Get models from different sources
        gcs_models = get_models_from_gcs()
        vertex_models = get_models_from_vertex_ai()
        
        # Combine and process models
        all_models = combine_model_sources(gcs_models, vertex_models)
        
        # Sort models
        all_models = sort_models(all_models, sort_order)
        
        # Limit results
        if limit > 0:
            all_models = all_models[:limit]
        
        # Format response
        if response_format == 'summary':
            response = format_models_summary(all_models)
        elif response_format == 'table':
            response = format_models_table(all_models)
        else:
            response = {
                'status': 'success',
                'models': all_models,
                'total_count': len(all_models),
                'timestamp': datetime.now().isoformat(),
                'sources': {
                    'gcs_models': len(gcs_models),
                    'vertex_models': len(vertex_models)
                }
            }
        
        logger.info(f"Listed {len(all_models)} models")
        return json.dumps(response), 200, headers
        
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        return json.dumps({
            'error': f'Failed to list models: {str(e)}',
            'status': 'error'
        }), 500, headers

def get_models_from_gcs():
    """Get models stored in GCS"""
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(MODELS_BUCKET)
        
        models = []
        
        # List model files
        model_prefix = "models/"
        blobs = bucket.list_blobs(prefix=model_prefix)
        
        model_files = {}
        for blob in blobs:
            if blob.name.endswith('.pt') or blob.name.endswith('.pkl'):
                # Extract model info from filename
                filename = blob.name.replace(model_prefix, '')
                model_id = filename.split('_')[1] if '_' in filename else filename.split('.')[0]
                
                if model_id not in model_files:
                    model_files[model_id] = []
                
                model_files[model_id].append({
                    'file_name': filename,
                    'file_path': blob.name,
                    'size_bytes': blob.size,
                    'created_time': blob.time_created.isoformat(),
                    'updated_time': blob.updated.isoformat(),
                    'md5_hash': blob.md5_hash
                })
        
        # Process each model
        for model_id, files in model_files.items():
            # Get model metadata if available
            metadata = get_model_metadata_from_gcs(bucket, model_id)
            
            # Find the main model file
            main_file = None
            for file_info in files:
                if file_info['file_name'].endswith('.pt'):
                    main_file = file_info
                    break
            
            if not main_file:
                main_file = files[0]  # Use first file if no .pt file found
            
            model_info = {
                'model_id': model_id,
                'source': 'gcs',
                'name': metadata.get('name', f'Model {model_id}') if metadata else f'Model {model_id}',
                'created_time': main_file['created_time'],
                'updated_time': main_file['updated_time'],
                'size_bytes': sum(f['size_bytes'] for f in files),
                'file_count': len(files),
                'main_file': main_file,
                'all_files': files,
                'metadata': metadata or {},
                'gcs_path': f"gs://{MODELS_BUCKET}/{main_file['file_path']}",
                'status': 'available'
            }
            
            models.append(model_info)
        
        return models
        
    except Exception as e:
        logger.error(f"Error getting models from GCS: {e}")
        return []

def get_models_from_vertex_ai():
    """Get models from Vertex AI Model Registry"""
    try:
        aiplatform.init(project=PROJECT_ID, location=REGION)
        
        # List models
        models = aiplatform.Model.list()
        
        vertex_models = []
        for model in models:
            model_info = {
                'model_id': model.name.split('/')[-1],
                'source': 'vertex_ai',
                'name': model.display_name,
                'created_time': model.create_time.isoformat(),
                'updated_time': model.update_time.isoformat(),
                'description': model.description or '',
                'labels': dict(model.labels) if model.labels else {},
                'artifact_uri': model.artifact_uri,
                'serving_container_image_uri': model.container_spec.image_uri if model.container_spec else None,
                'resource_name': model.resource_name,
                'status': 'available',
                'metadata': {
                    'model_type': model.labels.get('model_type', 'unknown') if model.labels else 'unknown',
                    'training_pipeline': model.labels.get('training_pipeline', 'unknown') if model.labels else 'unknown'
                }
            }
            
            vertex_models.append(model_info)
        
        return vertex_models
        
    except Exception as e:
        logger.error(f"Error getting models from Vertex AI: {e}")
        return []

def get_model_metadata_from_gcs(bucket, model_id):
    """Get model metadata from GCS"""
    try:
        info_blob_name = f"models/info_{model_id}.json"
        blob = bucket.blob(info_blob_name)
        
        if blob.exists():
            metadata = json.loads(blob.download_as_text())
            return metadata
        
        return None
        
    except Exception as e:
        logger.warning(f"Error getting model metadata for {model_id}: {e}")
        return None

def combine_model_sources(gcs_models, vertex_models):
    """Combine models from different sources"""
    all_models = []
    
    # Add GCS models
    all_models.extend(gcs_models)
    
    # Add Vertex AI models
    all_models.extend(vertex_models)
    
    # Remove duplicates based on model_id
    seen_ids = set()
    unique_models = []
    
    for model in all_models:
        model_id = model['model_id']
        if model_id not in seen_ids:
            seen_ids.add(model_id)
            unique_models.append(model)
        else:
            # If duplicate, prefer Vertex AI model
            if model['source'] == 'vertex_ai':
                # Replace the existing GCS model with Vertex AI model
                for i, existing in enumerate(unique_models):
                    if existing['model_id'] == model_id:
                        unique_models[i] = model
                        break
    
    return unique_models

def sort_models(models, sort_order):
    """Sort models by the specified order"""
    if sort_order == 'newest':
        return sorted(models, key=lambda x: x['created_time'], reverse=True)
    elif sort_order == 'oldest':
        return sorted(models, key=lambda x: x['created_time'])
    elif sort_order == 'name':
        return sorted(models, key=lambda x: x['name'].lower())
    else:
        return models

def format_models_summary(models):
    """Format models as a summary"""
    summary = {
        'total_models': len(models),
        'sources': {},
        'model_types': {},
        'recent_models': [],
        'timestamp': datetime.now().isoformat()
    }
    
    # Count by source
    for model in models:
        source = model['source']
        summary['sources'][source] = summary['sources'].get(source, 0) + 1
        
        # Count by model type
        model_type = model.get('metadata', {}).get('model_type', 'unknown')
        summary['model_types'][model_type] = summary['model_types'].get(model_type, 0) + 1
    
    # Recent models (last 5)
    for model in models[:5]:
        summary['recent_models'].append({
            'model_id': model['model_id'],
            'name': model['name'],
            'source': model['source'],
            'created_time': model['created_time'],
            'status': model['status']
        })
    
    return summary

def format_models_table(models):
    """Format models as a table"""
    table_data = {
        'headers': ['Model ID', 'Name', 'Source', 'Created', 'Status', 'Size'],
        'rows': [],
        'timestamp': datetime.now().isoformat()
    }
    
    for model in models:
        # Format size
        size_mb = model.get('size_bytes', 0) / (1024 * 1024)
        size_str = f"{size_mb:.1f} MB" if size_mb > 0 else "N/A"
        
        # Format created time
        created_time = model['created_time'][:10]  # Just the date part
        
        row = [
            model['model_id'],
            model['name'],
            model['source'].upper(),
            created_time,
            model['status'],
            size_str
        ]
        
        table_data['rows'].append(row)
    
    return table_data

def get_model_performance_metrics(model_id):
    """Get performance metrics for a model (if available)"""
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(MODELS_BUCKET)
        
        # Try to get training history
        history_blob_name = f"models/history_{model_id}.json"
        blob = bucket.blob(history_blob_name)
        
        if blob.exists():
            history = json.loads(blob.download_as_text())
            
            # Extract final metrics
            if 'val_history' in history and history['val_history']:
                final_metrics = history['val_history'][-1]
                return {
                    'final_accuracy': final_metrics.get('accuracy', 0),
                    'final_loss': final_metrics.get('loss', 0),
                    'final_f1_score': final_metrics.get('f1_score', 0),
                    'training_epochs': len(history.get('train_history', [])),
                    'best_epoch': history.get('best_epoch', 0)
                }
        
        return None
        
    except Exception as e:
        logger.warning(f"Error getting performance metrics for {model_id}: {e}")
        return None