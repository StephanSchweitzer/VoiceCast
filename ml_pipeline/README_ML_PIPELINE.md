# VoiceCast ML Pipeline

This document provides comprehensive documentation for the VoiceCast ML Pipeline integration, including setup instructions, API usage, cost optimization, and troubleshooting.

## Overview

The VoiceCast ML Pipeline is a complete machine learning infrastructure for audio processing, model training, and deployment. It integrates seamlessly with the existing VoiceCast infrastructure while maintaining complete separation and cost optimization.

## Architecture

### Core Components

1. **Data Processing Pipeline** (`ml_pipeline/data_processing/`)
   - Audio file preprocessing
   - Feature extraction
   - Data augmentation
   - Dataset preparation

2. **Model Training Pipeline** (`ml_pipeline/model/`)
   - Neural network architectures (MLP, Transformer)
   - Training orchestration
   - Model evaluation
   - Vertex AI integration

3. **Infrastructure** (`terraform/ml_pipeline/`)
   - GCS buckets for data storage
   - Vertex AI resources
   - Cloud Functions for API triggers
   - Compute instances for training
   - IAM and security setup

4. **API Endpoints**
   - `/api/ml/trigger-data-pipeline` - Manual data processing
   - `/api/ml/trigger-training` - Manual training trigger
   - `/api/ml/trigger-complete-pipeline` - End-to-end pipeline
   - `/api/ml/pipeline-status` - Status monitoring
   - `/api/ml/list-models` - Available models

## Setup Instructions

### Prerequisites

1. **GCP Project Setup**
   - Project ID: `voicecast-464815`
   - Region: `europe-west1`
   - Billing account enabled
   - Required APIs enabled (handled by Terraform)

2. **Environment Variables**
   ```bash
   export GCP_PROJECT_ID=voicecast-464815
   export GCP_REGION=europe-west1
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```

3. **Dependencies**
   ```bash
   pip install -r ml_pipeline/requirements.txt
   ```

### Infrastructure Deployment

1. **Navigate to ML Pipeline Terraform**
   ```bash
   cd terraform/ml_pipeline
   ```

2. **Initialize Terraform**
   ```bash
   terraform init
   ```

3. **Review and Apply**
   ```bash
   terraform plan
   terraform apply
   ```

4. **Verify Deployment**
   ```bash
   terraform output
   ```

### Initial Setup

1. **Upload ML Pipeline Code**
   ```bash
   gsutil cp -r ../../ml_pipeline/ gs://voicecast-464815-ml-pipeline-models/
   ```

2. **Create Default Configuration**
   ```bash
   cd ../../ml_pipeline
   python run_data_pipeline.py --create-default-config
   ```

3. **Validate GCP Setup**
   ```bash
   python run_data_pipeline.py --validate-setup
   ```

## Usage Guide

### 1. Data Processing Pipeline

#### Upload Raw Audio Data
```bash
# Upload your audio files to the raw data bucket
gsutil cp /path/to/audio/files/* gs://voicecast-464815-ml-pipeline-raw-data/
```

#### Trigger Data Processing
```bash
# Using the Python script
python run_data_pipeline.py --pipeline-id my-data-pipeline-001

# Using the API endpoint
curl -X POST https://YOUR_FUNCTION_URL/trigger-data-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline_config": {
      "data_processing": {
        "batch_size": 32,
        "sample_rate": 22050,
        "augmentation": {
          "enabled": true,
          "noise_injection": true,
          "pitch_shifting": true,
          "time_stretching": true
        }
      }
    }
  }'
```

### 2. Model Training Pipeline

#### Trigger Training
```bash
# Using the Python script
python run_train_pipeline.py \
  --dataset-path gs://voicecast-464815-ml-pipeline-processed-data/datasets/processed_dataset_my-data-pipeline-001.pkl \
  --model-type transformer \
  --epochs 50 \
  --batch-size 32 \
  --learning-rate 0.001

# Using the API endpoint
curl -X POST https://YOUR_FUNCTION_URL/trigger-training-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_path": "gs://voicecast-464815-ml-pipeline-processed-data/datasets/processed_dataset_my-data-pipeline-001.pkl",
    "training_config": {
      "model_type": "transformer",
      "epochs": 50,
      "batch_size": 32,
      "learning_rate": 0.001
    }
  }'
```

### 3. Complete Pipeline

#### End-to-End Execution
```bash
# Using the Python script
python run_complete_pipeline.py \
  --model-type transformer \
  --epochs 50 \
  --batch-size 32

# Using the API endpoint
curl -X POST https://YOUR_FUNCTION_URL/trigger-complete-pipeline \
  -H "Content-Type: application/json" \
  -d '{
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
    }
  }'
```

### 4. Pipeline Monitoring

#### Check Pipeline Status
```bash
# Using the API endpoint
curl -X GET https://YOUR_FUNCTION_URL/pipeline-status?pipeline_id=my-pipeline-001

# Response format
{
  "pipeline_id": "my-pipeline-001",
  "status": "running",
  "progress": 0.65,
  "message": "Training epoch 32/50 - Loss: 0.1234, Acc: 85.67%",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "current_epoch": 32,
    "total_epochs": 50,
    "current_loss": 0.1234,
    "current_accuracy": 85.67
  }
}
```

#### List Available Models
```bash
# Using the API endpoint
curl -X GET https://YOUR_FUNCTION_URL/list-models

# Response format
{
  "models": [
    {
      "name": "voicecast-ml-model-my-pipeline-001",
      "resource_name": "projects/voicecast-464815/locations/europe-west1/models/123456789",
      "create_time": "2024-01-15T10:00:00Z",
      "update_time": "2024-01-15T12:00:00Z",
      "description": "Audio ML model trained via pipeline my-pipeline-001"
    }
  ]
}
```

## Configuration

### Pipeline Configuration File

```yaml
# pipeline_config.yaml
data_processing:
  batch_size: 32
  sample_rate: 22050
  max_duration: 30.0
  min_duration: 1.0
  normalization: true
  augmentation:
    enabled: true
    noise_injection: true
    pitch_shifting: true
    time_stretching: true

training:
  model_type: transformer  # or 'mlp'
  epochs: 100
  learning_rate: 0.001
  batch_size: 16
  validation_split: 0.2
  early_stopping:
    patience: 10
    monitor: val_loss
  checkpointing:
    save_best_only: true
    save_frequency: 5

infrastructure:
  machine_type: n1-standard-4
  accelerator_type: NVIDIA_TESLA_T4
  accelerator_count: 1
  preemptible: true
  max_runtime_hours: 8
```

### Environment Variables

```bash
# Required
export GCP_PROJECT_ID=voicecast-464815
export GCP_REGION=europe-west1

# Optional
export PIPELINE_CONFIG_PATH=/path/to/pipeline_config.yaml
export ML_RAW_DATA_BUCKET=voicecast-464815-ml-pipeline-raw-data
export ML_PROCESSED_DATA_BUCKET=voicecast-464815-ml-pipeline-processed-data
export ML_MODELS_BUCKET=voicecast-464815-ml-pipeline-models
```

## Cost Optimization

### Features Implemented

1. **Preemptible Instances**
   - 70% cost reduction for training
   - Automatic restart handling
   - Configurable via `use_preemptible_instances`

2. **Auto-scaling**
   - Scale to zero when idle
   - Scale up based on demand
   - Configurable max instances

3. **Storage Lifecycle Management**
   - Automatic cleanup of old data
   - Tiered storage (Standard → Nearline → Coldline)
   - Configurable retention periods

4. **GPU Selection**
   - Cost-effective T4 GPUs by default
   - Configurable GPU types and counts
   - Regional optimization

### Cost Estimates

| Component | Monthly Cost (Optimized) | Monthly Cost (Standard) |
|-----------|-------------------------|------------------------|
| Storage (500GB) | $10-20 | $10-20 |
| Compute (50 hours) | $25-50 | $80-150 |
| Vertex AI | $5-15 | $5-15 |
| Cloud Functions | $1-5 | $1-5 |
| **Total** | **$40-90** | **$95-190** |

### Cost Optimization Tips

1. **Use Preemptible Instances**
   ```bash
   # Set in terraform/ml_pipeline/variables.tf
   variable "use_preemptible_instances" {
     default = true
   }
   ```

2. **Enable Auto-scaling**
   ```bash
   # Set in terraform/ml_pipeline/variables.tf
   variable "enable_auto_scaling" {
     default = true
   }
   ```

3. **Configure Lifecycle Management**
   ```bash
   # Set retention periods
   variable "data_retention_days" {
     default = 90
   }
   variable "model_retention_days" {
     default = 365
   }
   ```

4. **Monitor Usage**
   ```bash
   # Check costs
   gcloud billing budgets list
   gcloud compute instances list --filter="labels.project=voicecast"
   ```

## Monitoring and Alerting

### Built-in Monitoring

1. **Pipeline Status Tracking**
   - Real-time progress updates
   - Error handling and reporting
   - Metadata tracking

2. **Resource Monitoring**
   - Compute instance utilization
   - Storage usage
   - API call metrics

3. **Cost Monitoring**
   - Budget alerts
   - Usage tracking
   - Cost optimization recommendations

### Custom Metrics

```python
# Example: Custom metric tracking
from google.cloud import monitoring_v3

client = monitoring_v3.MetricServiceClient()
project_name = f"projects/{project_id}"

# Create custom metric
descriptor = monitoring_v3.MetricDescriptor(
    type="custom.googleapis.com/ml_pipeline/training_accuracy",
    metric_kind=monitoring_v3.MetricDescriptor.MetricKind.GAUGE,
    value_type=monitoring_v3.MetricDescriptor.ValueType.DOUBLE,
    description="Training accuracy for ML pipeline",
)

client.create_metric_descriptor(name=project_name, metric_descriptor=descriptor)
```

## Troubleshooting

### Common Issues

1. **Pipeline Fails to Start**
   ```bash
   # Check bucket permissions
   gsutil ls gs://voicecast-464815-ml-pipeline-raw-data/
   
   # Check service account
   gcloud iam service-accounts list --filter="email:*ml-pipeline*"
   
   # Check API enablement
   gcloud services list --enabled | grep aiplatform
   ```

2. **Training Instance Fails**
   ```bash
   # Check compute quotas
   gcloud compute project-info describe --format="value(quotas)"
   
   # Check GPU availability
   gcloud compute accelerator-types list --filter="zone:europe-west1-*"
   
   # Check instance logs
   gcloud compute instances get-serial-port-output INSTANCE_NAME
   ```

3. **Out of Memory Errors**
   ```bash
   # Reduce batch size in config
   training:
     batch_size: 8  # Reduce from 32
   
   # Use gradient accumulation
   training:
     gradient_accumulation_steps: 4
   ```

4. **Storage Issues**
   ```bash
   # Check bucket existence
   gsutil ls gs://voicecast-464815-ml-pipeline-*
   
   # Check permissions
   gsutil iam get gs://voicecast-464815-ml-pipeline-raw-data
   
   # Check quota
   gcloud compute project-info describe --format="value(quotas[].usage,quotas[].limit)"
   ```

### Debugging Commands

```bash
# Pipeline status
curl -X GET https://YOUR_FUNCTION_URL/pipeline-status?pipeline_id=YOUR_PIPELINE_ID

# Instance logs
gcloud compute instances get-serial-port-output INSTANCE_NAME --zone=europe-west1-a

# Function logs
gcloud functions logs read --filter="resource.function_name=trigger-data-pipeline"

# Vertex AI job status
gcloud ai custom-jobs list --region=europe-west1

# Storage access test
gsutil -m cp -r gs://voicecast-464815-ml-pipeline-raw-data/* ./test_download/
```

### Performance Optimization

1. **Data Processing**
   - Use parallel processing
   - Optimize batch sizes
   - Enable data augmentation selectively

2. **Training**
   - Use mixed precision training
   - Implement gradient accumulation
   - Optimize learning rate scheduling

3. **Infrastructure**
   - Use appropriate instance types
   - Enable auto-scaling
   - Use regional persistent disks

## API Reference

### Endpoints

1. **POST /api/ml/trigger-data-pipeline**
   - Triggers data processing pipeline
   - Authentication: Service account or admin
   - Rate limit: 10 requests/hour

2. **POST /api/ml/trigger-training**
   - Triggers model training pipeline
   - Authentication: Service account or admin
   - Rate limit: 5 requests/hour

3. **POST /api/ml/trigger-complete-pipeline**
   - Triggers complete end-to-end pipeline
   - Authentication: Service account or admin
   - Rate limit: 3 requests/hour

4. **GET /api/ml/pipeline-status**
   - Gets pipeline status and progress
   - Authentication: Public (read-only)
   - Rate limit: 100 requests/hour

5. **GET /api/ml/list-models**
   - Lists available trained models
   - Authentication: Public (read-only)
   - Rate limit: 50 requests/hour

### Request/Response Formats

See the individual API endpoint documentation above for detailed request and response formats.

## Security

### Authentication

- Service account based authentication
- IAM roles and permissions
- API key authentication for external access

### Access Control

- Admin-only access to pipeline triggers
- Read-only access to status endpoints
- Network security groups
- VPC firewall rules

### Data Security

- Encryption at rest for all buckets
- Encryption in transit for all communications
- Secure credential management via Secret Manager
- Regular security audits and updates

## Maintenance

### Regular Tasks

1. **Weekly**
   - Monitor pipeline performance
   - Check cost optimization
   - Review error logs

2. **Monthly**
   - Update dependencies
   - Review and update configurations
   - Performance optimization

3. **Quarterly**
   - Security audit
   - Cost analysis and optimization
   - Infrastructure updates

### Backup and Recovery

- Automated bucket versioning
- Regular configuration backups
- Model artifact retention
- Disaster recovery procedures

## Support

For issues and questions:

1. Check this documentation
2. Review troubleshooting section
3. Check pipeline logs and status
4. Contact the VoiceCast development team

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial ML pipeline implementation
- Complete infrastructure setup
- API endpoints for manual triggers
- Cost optimization features
- Monitoring and alerting
- Comprehensive documentation