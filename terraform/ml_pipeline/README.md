# VoiceCast ML Pipeline Terraform Module

This Terraform module creates the complete infrastructure for the VoiceCast ML pipeline on Google Cloud Platform (GCP). It provides a modular and structured approach to deploying machine learning resources including Vertex AI training instances, Cloud Storage, and Cloud Run APIs.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Resources Created](#resources-created)
- [Deployment](#deployment)
- [Usage](#usage)
- [Cost Optimization](#cost-optimization)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

The ML pipeline module creates the following key components:

1. **Vertex AI Training Instance** - GPU-enabled for model training with preemptible instances
2. **GCS Bucket** - Dedicated storage for processed data and trained models with lifecycle rules
3. **Cloud Run API** - Manual triggering of pipelines with environment variables
4. **IAM Resources** - Service accounts and permissions for secure operations
5. **Monitoring** - Cloud Scheduler for automated pipeline execution

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloud Run     │    │   Vertex AI     │    │   GCS Bucket    │
│   ML API        │◄──►│   Training      │◄──►│   Storage       │
│                 │    │   Instance      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Service       │    │   Notebook      │    │   Lifecycle     │
│   Accounts      │    │   Instance      │    │   Management    │
│   & IAM         │    │   (Optional)    │    │   Rules         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

Before deploying this module, ensure you have:

1. **GCP Project** with billing enabled
2. **Terraform** >= 1.0 installed
3. **Google Cloud SDK** installed and configured
4. **Required APIs** enabled (automatically enabled by the module):
   - Vertex AI API
   - Cloud Storage API
   - Cloud Run API
   - Compute Engine API
   - Notebooks API
   - Cloud Build API
   - Secret Manager API

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/StephanSchweitzer/VoiceCast.git
cd VoiceCast/terraform/ml_pipeline
```

### 2. Configure Environment

```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your GCP configuration
nano .env
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan and Apply

```bash
# Review the planned changes
terraform plan

# Apply the configuration
terraform apply
```

## Configuration

### Environment Variables

The module uses the following environment variables (configured in `.env`):

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GCP_PROJECT_ID` | Your GCP project ID | Yes | - |
| `GCP_REGION` | GCP region for resources | No | `us-central1` |
| `ML_PIPELINE_BUCKET_NAME` | Custom bucket name | No | Auto-generated |
| `VERTEX_AI_MODEL_NAME` | Model name in Vertex AI | No | `voicecast-emotion-model` |
| `TRAINING_INSTANCE_TYPE` | Machine type for training | No | `n1-standard-4` |
| `GPU_TYPE` | GPU type for training | No | `NVIDIA_TESLA_K80` |
| `GPU_COUNT` | Number of GPUs | No | `1` |
| `PREEMPTIBLE` | Use preemptible instances | No | `true` |
| `CLOUD_RUN_MAX_INSTANCES` | Max Cloud Run instances | No | `10` |
| `CLOUD_RUN_MEMORY` | Memory per instance | No | `2Gi` |
| `CLOUD_RUN_CPU` | CPU per instance | No | `1000m` |
| `BUCKET_LIFECYCLE_DAYS` | Days before auto-deletion | No | `30` |
| `ALLOW_PUBLIC_ACCESS` | Allow public API access | No | `false` |

### Terraform Variables

You can also configure the module using Terraform variables:

```hcl
module "ml_pipeline" {
  source = "./ml_pipeline"
  
  project_id               = "your-gcp-project"
  region                   = "us-central1"
  app_name                 = "voicecast"
  environment              = "production"
  vertex_ai_model_name     = "voicecast-emotion-model"
  training_instance_type   = "n1-standard-8"
  gpu_type                 = "NVIDIA_TESLA_V100"
  gpu_count                = 2
  preemptible              = false
  cloud_run_max_instances  = 50
  bucket_lifecycle_days    = 90
  allow_public_access      = true
}
```

## Resources Created

### 1. Vertex AI Resources

- **Model Registry**: Stores and versions your ML models
- **Training Job Template**: GPU-enabled training with preemptible instances
- **Model Endpoint**: Serves the trained model for predictions
- **Notebook Instance**: Development environment for data scientists

### 2. Storage Resources

- **GCS Bucket**: Organized storage with folders:
  - `processed-data/`: Cleaned and processed datasets
  - `models/`: Trained model artifacts
  - `training-data/`: Raw training data
  - `logs/`: Pipeline execution logs
- **Lifecycle Rules**: Automatic cleanup of old files
- **Versioning**: Enabled for model artifacts

### 3. Cloud Run API

- **ML Pipeline API**: RESTful API for pipeline management
- **Auto-scaling**: Scales to zero when not in use
- **Environment Variables**: Pre-configured for seamless integration
- **Health Checks**: Startup and liveness probes

### 4. IAM and Security

- **Service Accounts**: Separate accounts for different components
- **IAM Roles**: Minimal required permissions
- **Secret Manager**: Secure storage for service account keys
- **Network Security**: VPC configuration and access controls

### 5. Monitoring and Automation

- **Cloud Scheduler**: Automated pipeline execution
- **Logging**: Structured logging for all components
- **Monitoring**: Resource usage and performance metrics

## Deployment

### Development Environment

```bash
# Set development variables
export TF_VAR_environment="dev"
export TF_VAR_preemptible="true"
export TF_VAR_gpu_type="NVIDIA_TESLA_K80"

# Deploy
terraform apply
```

### Production Environment

```bash
# Set production variables
export TF_VAR_environment="prod"
export TF_VAR_preemptible="false"
export TF_VAR_gpu_type="NVIDIA_TESLA_V100"
export TF_VAR_gpu_count="2"
export TF_VAR_cloud_run_max_instances="50"

# Deploy
terraform apply
```

### CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Deploy ML Pipeline
on:
  push:
    branches: [main]
    paths: ['terraform/ml_pipeline/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Configure GCP
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          
      - name: Deploy ML Pipeline
        run: |
          cd terraform/ml_pipeline
          terraform init
          terraform plan
          terraform apply -auto-approve
```

## Usage

### 1. Trigger ML Pipeline

```bash
# Get the API URL from Terraform output
API_URL=$(terraform output -raw ml_pipeline_api_url)

# Trigger complete pipeline
curl -X POST "$API_URL/trigger" \
  -H "Content-Type: application/json" \
  -d '{"pipeline_type": "complete"}'

# Trigger data pipeline only
curl -X POST "$API_URL/trigger" \
  -H "Content-Type: application/json" \
  -d '{"pipeline_type": "data"}'

# Trigger training pipeline only
curl -X POST "$API_URL/trigger" \
  -H "Content-Type: application/json" \
  -d '{"pipeline_type": "training"}'
```

### 2. Access Notebook Instance

```bash
# Get notebook proxy URI
NOTEBOOK_URI=$(terraform output -raw ml_notebook_proxy_uri)
echo "Access your notebook at: $NOTEBOOK_URI"
```

### 3. Monitor Pipeline Status

```bash
# Check bucket contents
gsutil ls gs://$(terraform output -raw ml_pipeline_bucket_name)

# Check model in Vertex AI
gcloud ai models list --region=$(terraform output -raw vertex_ai_region)

# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$(terraform output -raw ml_pipeline_api_name)" --limit=50
```

## Cost Optimization

The module includes several cost optimization features:

1. **Preemptible Instances**: Default for training jobs (up to 80% cost reduction)
2. **Auto-scaling**: Cloud Run scales to zero when not in use
3. **Lifecycle Rules**: Automatic cleanup of old files after 30 days
4. **Right-sizing**: Configurable instance types and resource limits

### Estimated Monthly Costs (us-central1)

| Component | Configuration | Estimated Cost |
|-----------|---------------|----------------|
| Cloud Run | 1M requests/month | $0.40 |
| GCS Bucket | 100GB storage | $2.00 |
| Vertex AI Training | 10 hours/month (preemptible) | $15.00 |
| Notebook Instance | 40 hours/month | $25.00 |
| **Total** | | **~$42.40/month** |

## Monitoring and Logging

### Cloud Monitoring

The module automatically creates monitoring for:
- Cloud Run service health and performance
- GCS bucket usage and access patterns
- Vertex AI training job metrics
- Notebook instance resource usage

### Logging

Structured logging is enabled for:
- API requests and responses
- Training job progress and errors
- Data pipeline execution status
- System metrics and alerts

### Alerting

Configure alerts for:
- Failed pipeline executions
- High resource usage
- Cost thresholds
- Security events

## Troubleshooting

### Common Issues

1. **API Not Enabled**
   ```bash
   # Check enabled APIs
   gcloud services list --enabled
   
   # Enable missing APIs
   gcloud services enable aiplatform.googleapis.com
   ```

2. **Permission Denied**
   ```bash
   # Check service account roles
   gcloud projects get-iam-policy $PROJECT_ID
   
   # Add required roles
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:$SA_EMAIL" \
     --role="roles/aiplatform.user"
   ```

3. **Quota Exceeded**
   ```bash
   # Check quotas
   gcloud compute project-info describe
   
   # Request quota increase in GCP Console
   ```

4. **Training Job Failures**
   ```bash
   # Check training job logs
   gcloud ai custom-jobs describe $JOB_ID --region=$REGION
   
   # View detailed logs
   gcloud logging read "resource.type=ml_job"
   ```

### Debug Mode

Enable debug logging:

```bash
export TF_LOG=DEBUG
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
terraform apply
```

### Clean Up

To remove all resources:

```bash
terraform destroy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
pytest tests/

# Format code
black .
isort .

# Lint
flake8 .
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the [troubleshooting section](#troubleshooting)
- Review GCP documentation for specific services
- Open an issue in the repository
- Contact the development team

---

**Note**: This module is designed to work with the existing VoiceCast application and should be deployed as part of the complete infrastructure stack.