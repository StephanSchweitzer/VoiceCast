# ML Pipeline Integration - Getting Started Guide

This document provides a quick start guide for using the newly integrated ML pipeline infrastructure in VoiceCast.

## Overview

The ML pipeline has been successfully integrated into the VoiceCast Terraform infrastructure as a modular component. It includes:

✅ **Vertex AI Training Instance** - GPU-enabled for model training with preemptible instances  
✅ **GCS Bucket** - Dedicated storage with lifecycle rules for automatic cleanup  
✅ **Cloud Run API** - Manual pipeline triggering with environment variables  
✅ **IAM Resources** - Service accounts and permissions for secure operations  
✅ **Environment Configuration** - Separate .env file for ML pipeline settings  
✅ **Documentation** - Comprehensive README with setup instructions  

## Quick Start

### 1. Enable ML Pipeline

Add these variables to your `terraform/terraform.tfvars` file:

```hcl
# Enable ML Pipeline
ml_pipeline_enabled = true

# Basic configuration
ml_pipeline_bucket_name = "voicecast-dev-ml-pipeline"
vertex_ai_model_name = "voicecast-emotion-model"
ml_environment = "dev"
```

### 2. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 3. Get Output Values

```bash
# Get bucket name
terraform output ml_pipeline_bucket_name

# Get API URL
terraform output ml_pipeline_api_url

# Get Vertex AI model name
terraform output vertex_ai_model_name

# Get notebook access URL
terraform output ml_notebook_proxy_uri
```

## Directory Structure

```
terraform/
├── ml_pipeline/
│   ├── main.tf                 # Core configuration and APIs
│   ├── variables.tf            # ML pipeline variables
│   ├── vertex_ai.tf           # Vertex AI resources
│   ├── storage.tf             # GCS bucket with lifecycle rules
│   ├── cloud_run.tf           # Cloud Run API service
│   ├── iam.tf                 # Service accounts and permissions
│   ├── outputs.tf             # Required outputs
│   ├── .env                   # Environment variables template
│   ├── terraform.tfvars.example # Configuration examples
│   └── README.md              # Detailed documentation
├── main.tf                    # Updated with ML pipeline APIs
├── variables.tf               # Updated with ML pipeline variables
├── outputs.tf                 # Updated with ML pipeline outputs
└── terraform.tfvars.example   # Updated with ML pipeline config
```

## Cost-Optimized Configuration

For development/testing:
```hcl
ml_pipeline_enabled = true
preemptible = true
gpu_type = "NVIDIA_TESLA_K80"
gpu_count = 1
cloud_run_max_instances = 10
bucket_lifecycle_days = 30
```

For production:
```hcl
ml_pipeline_enabled = true
preemptible = false
gpu_type = "NVIDIA_TESLA_V100"
gpu_count = 2
cloud_run_max_instances = 50
bucket_lifecycle_days = 90
```

## Environment Configuration

The ML pipeline uses a separate `.env` file located at `terraform/ml_pipeline/.env`. Configure it with your GCP project settings:

```bash
# Copy template and configure
cp terraform/ml_pipeline/.env.example terraform/ml_pipeline/.env
# Edit with your values
```

## Integration with Existing Infrastructure

The ML pipeline is designed to work seamlessly with the existing VoiceCast infrastructure:

- **No modifications** to existing terraform files (except adding required APIs)
- **Conditional deployment** using `ml_pipeline_enabled` variable
- **Shared variables** for project_id, region, and app_name
- **Consistent naming** and labeling with existing resources

## Next Steps

1. **Review the detailed documentation** in `terraform/ml_pipeline/README.md`
2. **Configure environment variables** in `terraform/ml_pipeline/.env`
3. **Deploy the infrastructure** using terraform
4. **Test the pipeline** using the Cloud Run API endpoints
5. **Monitor resources** using the provided outputs and GCP Console

## Support

For detailed setup instructions, troubleshooting, and advanced configuration options, refer to the comprehensive README at `terraform/ml_pipeline/README.md`.