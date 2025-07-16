# ML Pipeline Terraform Module

This Terraform module creates the complete infrastructure for the VoiceCast ML Pipeline, including storage, compute, Vertex AI, and Cloud Functions resources.

## Architecture Overview

The ML Pipeline infrastructure consists of:

- **Storage**: GCS buckets for raw data, processed data, models, and temporary files
- **Compute**: Instance templates and managed instance groups for training and data processing
- **Vertex AI**: Custom training jobs, model registry, and endpoints
- **Cloud Functions**: API triggers for manual pipeline execution
- **IAM**: Service accounts and permissions for secure access
- **Monitoring**: Pub/Sub topics, logging, and alerting

## Usage

### Basic Usage

```hcl
module "ml_pipeline" {
  source = "./terraform/ml_pipeline"
  
  project_id = "voicecast-464815"
  region     = "europe-west1"
  app_name   = "voicecast"
}
```

### Advanced Configuration

```hcl
module "ml_pipeline" {
  source = "./terraform/ml_pipeline"
  
  project_id = "voicecast-464815"
  region     = "europe-west1"
  app_name   = "voicecast"
  
  # GPU Configuration
  enable_gpu_training    = true
  gpu_type              = "nvidia-tesla-t4"
  gpu_count             = 1
  training_machine_type = "n1-standard-4"
  
  # Cost Optimization
  use_preemptible_instances = true
  enable_auto_scaling      = true
  max_training_instances   = 2
  
  # Storage Configuration
  data_retention_days         = 90
  model_retention_days        = 365
  enable_lifecycle_management = true
  
  # Features
  enable_monitoring     = true
  enable_notifications  = true
  enable_pub_sub       = true
  enable_secret_manager = true
  
  # API Configuration
  api_gateway_enabled      = true
  enable_authentication    = true
  cloud_functions_timeout  = 3600
  cloud_functions_memory   = "2Gi"
  
  # Labels
  labels = {
    project     = "voicecast"
    component   = "ml-pipeline"
    environment = "production"
    cost-center = "ml-ops"
  }
}
```

## Variables

### Required Variables

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `project_id` | GCP Project ID | `string` | `"voicecast-464815"` |
| `region` | GCP Region | `string` | `"europe-west1"` |
| `app_name` | Application name | `string` | `"voicecast"` |

### Optional Variables

#### GPU and Compute Configuration

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `enable_gpu_training` | Enable GPU instances for training | `bool` | `true` |
| `gpu_type` | GPU type for training instances | `string` | `"nvidia-tesla-t4"` |
| `gpu_count` | Number of GPUs per training instance | `number` | `1` |
| `training_machine_type` | Machine type for training instances | `string` | `"n1-standard-4"` |
| `use_preemptible_instances` | Use preemptible instances for cost optimization | `bool` | `true` |
| `max_training_instances` | Maximum number of training instances | `number` | `2` |
| `training_disk_size` | Disk size for training instances (GB) | `number` | `100` |
| `training_disk_type` | Disk type for training instances | `string` | `"pd-ssd"` |

#### Auto-scaling Configuration

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `enable_auto_scaling` | Enable auto-scaling for training resources | `bool` | `true` |

#### Storage Configuration

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `data_retention_days` | Data retention period in days | `number` | `90` |
| `model_retention_days` | Model retention period in days | `number` | `365` |
| `enable_lifecycle_management` | Enable automatic lifecycle management for buckets | `bool` | `true` |
| `enable_cost_optimization` | Enable cost optimization features | `bool` | `true` |

#### Feature Flags

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `enable_monitoring` | Enable monitoring and logging for ML pipeline | `bool` | `true` |
| `enable_notifications` | Enable email notifications for pipeline events | `bool` | `false` |
| `enable_pub_sub` | Enable Pub/Sub for pipeline events | `bool` | `true` |
| `enable_secret_manager` | Enable Secret Manager for ML pipeline credentials | `bool` | `true` |
| `enable_eventarc` | Enable Eventarc for event-driven pipeline triggers | `bool` | `true` |

#### API Configuration

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `api_gateway_enabled` | Enable API Gateway for ML pipeline endpoints | `bool` | `true` |
| `enable_authentication` | Enable authentication for API endpoints | `bool` | `true` |
| `enable_cors` | Enable CORS for API endpoints | `bool` | `true` |
| `cloud_functions_timeout` | Cloud Functions timeout in seconds | `number` | `3600` |
| `cloud_functions_memory` | Cloud Functions memory allocation | `string` | `"2Gi"` |

#### Vertex AI Configuration

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `vertex_ai_region` | Vertex AI region (can be different from main region) | `string` | `"europe-west1"` |

#### Notification Configuration

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `notification_email` | Email for pipeline notifications | `string` | `""` |
| `scheduler_timezone` | Timezone for Cloud Scheduler | `string` | `"Europe/London"` |

## Outputs

### Storage Outputs

| Name | Description |
|------|-------------|
| `ml_raw_data_bucket_name` | Name of the raw data bucket |
| `ml_processed_data_bucket_name` | Name of the processed data bucket |
| `ml_models_bucket_name` | Name of the models bucket |
| `ml_temp_bucket_name` | Name of the temporary bucket |

### Service Account Outputs

| Name | Description |
|------|-------------|
| `ml_pipeline_service_account_email` | Email of the ML pipeline service account |
| `ml_training_service_account_email` | Email of the ML training service account |

### API Endpoints

| Name | Description |
|------|-------------|
| `ml_pipeline_api_endpoints` | All ML Pipeline API endpoints |
| `trigger_data_pipeline_function_url` | URL of the trigger data pipeline function |
| `trigger_training_pipeline_function_url` | URL of the trigger training pipeline function |
| `pipeline_status_function_url` | URL of the pipeline status function |
| `list_models_function_url` | URL of the list models function |

### Infrastructure Outputs

| Name | Description |
|------|-------------|
| `vertex_ai_dataset_name` | Name of the Vertex AI dataset |
| `vertex_ai_tensorboard_name` | Name of the Vertex AI tensorboard |
| `training_instance_template_name` | Name of the training instance template |
| `ml_pipeline_configuration` | Complete configuration summary |

## Resources Created

### Storage Resources

- **google_storage_bucket.ml_raw_data**: Raw training data
- **google_storage_bucket.ml_processed_data**: Processed datasets
- **google_storage_bucket.ml_models**: Model artifacts and checkpoints
- **google_storage_bucket.ml_temp**: Temporary files
- **google_storage_bucket.ml_functions_source**: Cloud Functions source code

### Compute Resources

- **google_compute_instance_template.ml_training_template**: Training instance template
- **google_compute_instance_template.ml_data_processing_template**: Data processing template
- **google_compute_region_instance_group_manager.ml_training_group**: Managed instance group
- **google_compute_region_autoscaler.ml_training_autoscaler**: Auto-scaling configuration
- **google_compute_health_check.ml_training_health_check**: Health check for instances

### Vertex AI Resources

- **google_vertex_ai_dataset.ml_audio_dataset**: Audio dataset
- **google_vertex_ai_tensorboard.ml_pipeline_tensorboard**: Tensorboard for monitoring
- **google_vertex_ai_endpoint.ml_model_endpoint**: Model serving endpoint
- **google_vertex_ai_training_pipeline.ml_training_template**: Training pipeline template

### Cloud Functions

- **google_cloudfunctions2_function.trigger_data_pipeline**: Data pipeline trigger
- **google_cloudfunctions2_function.trigger_training_pipeline**: Training pipeline trigger
- **google_cloudfunctions2_function.trigger_complete_pipeline**: Complete pipeline trigger
- **google_cloudfunctions2_function.pipeline_status**: Pipeline status function
- **google_cloudfunctions2_function.list_models**: List models function

### IAM Resources

- **google_service_account.ml_pipeline_sa**: Main ML pipeline service account
- **google_service_account.ml_training_sa**: Training-specific service account
- **google_project_iam_custom_role.ml_pipeline_custom_role**: Custom IAM role
- Multiple **google_project_iam_member** resources for permissions

### Pub/Sub Resources

- **google_pubsub_topic.ml_pipeline_events**: Pipeline events topic
- **google_pubsub_subscription.ml_pipeline_events_subscription**: Events subscription
- **google_pubsub_topic.ml_pipeline_dead_letter**: Dead letter topic

## Prerequisites

1. **GCP Project**
   - Billing enabled
   - APIs will be enabled automatically by Terraform

2. **Terraform**
   - Version >= 1.0
   - Google provider >= 6.43.0

3. **Permissions**
   - Project Editor or Owner role
   - Or specific IAM permissions for all resources

## Deployment

### 1. Initialize Terraform

```bash
cd terraform/ml_pipeline
terraform init
```

### 2. Plan the Deployment

```bash
terraform plan
```

### 3. Apply the Configuration

```bash
terraform apply
```

### 4. Verify the Deployment

```bash
terraform output
```

## Cost Optimization

### Preemptible Instances

Enable preemptible instances for 70% cost savings:

```hcl
use_preemptible_instances = true
```

### Auto-scaling

Enable auto-scaling to scale to zero when idle:

```hcl
enable_auto_scaling = true
max_training_instances = 2
```

### Storage Lifecycle

Configure automatic storage lifecycle management:

```hcl
enable_lifecycle_management = true
data_retention_days = 90
model_retention_days = 365
enable_cost_optimization = true
```

### GPU Selection

Use cost-effective GPU types:

```hcl
gpu_type = "nvidia-tesla-t4"  # Most cost-effective
gpu_count = 1                 # Minimal required
```

## Security

### Service Accounts

The module creates dedicated service accounts with minimal required permissions:

- **ml_pipeline_sa**: Main service account for pipeline operations
- **ml_training_sa**: Training-specific service account
- **ml_monitoring_sa**: Monitoring service account (optional)

### IAM Permissions

Permissions are granted using the principle of least privilege:

- Storage admin for bucket operations
- Vertex AI user for ML operations
- Compute admin for instance management
- Custom roles for specific operations

### Secret Management

Credentials are stored securely in Secret Manager:

```hcl
enable_secret_manager = true
```

## Monitoring

### Built-in Monitoring

- Vertex AI Tensorboard for training metrics
- Cloud Monitoring for infrastructure metrics
- Pub/Sub for pipeline events
- Cloud Logging for all operations

### Custom Metrics

The module supports custom metrics for:

- Training progress
- Pipeline success/failure rates
- Cost tracking
- Resource utilization

## Troubleshooting

### Common Issues

1. **API Not Enabled**
   ```bash
   # Check if APIs are enabled
   gcloud services list --enabled
   ```

2. **Insufficient Permissions**
   ```bash
   # Check IAM permissions
   gcloud projects get-iam-policy PROJECT_ID
   ```

3. **Quota Exceeded**
   ```bash
   # Check quotas
   gcloud compute project-info describe --format="value(quotas)"
   ```

4. **Resource Already Exists**
   ```bash
   # Import existing resources
   terraform import google_storage_bucket.ml_raw_data BUCKET_NAME
   ```

### Debugging Commands

```bash
# Check Terraform state
terraform state list

# Check specific resource
terraform state show google_storage_bucket.ml_raw_data

# Refresh state
terraform refresh

# Check drift
terraform plan -refresh-only
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   terraform init -upgrade
   ```

2. **Check for Drift**
   ```bash
   terraform plan -refresh-only
   ```

3. **Review Costs**
   ```bash
   gcloud billing budgets list
   ```

### Updates

To update the module:

1. Update the module version
2. Run `terraform init -upgrade`
3. Run `terraform plan` to review changes
4. Run `terraform apply` to apply updates

## Examples

### Minimal Configuration

```hcl
module "ml_pipeline" {
  source = "./terraform/ml_pipeline"
  
  project_id = "voicecast-464815"
  region     = "europe-west1"
  app_name   = "voicecast"
}
```

### Production Configuration

```hcl
module "ml_pipeline" {
  source = "./terraform/ml_pipeline"
  
  project_id = "voicecast-464815"
  region     = "europe-west1"
  app_name   = "voicecast"
  
  # Cost optimization
  use_preemptible_instances = true
  enable_auto_scaling      = true
  enable_cost_optimization = true
  
  # Features
  enable_monitoring     = true
  enable_notifications  = true
  enable_secret_manager = true
  
  # Retention
  data_retention_days  = 90
  model_retention_days = 365
  
  # Security
  enable_authentication = true
  
  # Performance
  training_machine_type = "n1-standard-8"
  gpu_type             = "nvidia-tesla-t4"
  max_training_instances = 3
  
  labels = {
    project     = "voicecast"
    environment = "production"
    cost-center = "ml-ops"
    owner       = "ml-team"
  }
}
```

### Development Configuration

```hcl
module "ml_pipeline" {
  source = "./terraform/ml_pipeline"
  
  project_id = "voicecast-464815"
  region     = "europe-west1"
  app_name   = "voicecast"
  
  # Minimal resources for development
  enable_gpu_training      = false
  enable_auto_scaling      = false
  max_training_instances   = 1
  use_preemptible_instances = true
  
  # Shorter retention for development
  data_retention_days  = 30
  model_retention_days = 90
  
  # Disable advanced features
  enable_monitoring    = false
  enable_notifications = false
  
  labels = {
    project     = "voicecast"
    environment = "development"
    cost-center = "ml-ops"
  }
}
```

## Support

For issues with this Terraform module:

1. Check the troubleshooting section
2. Review Terraform and GCP documentation
3. Check the main VoiceCast repository issues
4. Contact the infrastructure team

## License

This module is part of the VoiceCast project and follows the same license terms.