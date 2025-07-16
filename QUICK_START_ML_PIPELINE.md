# VoiceCast ML Pipeline - Quick Start Guide

This guide provides a quick start to get the VoiceCast ML Pipeline up and running.

## 🚀 Quick Setup

### 1. Prerequisites

Ensure you have the following installed:
- Google Cloud SDK (`gcloud`)
- Terraform >= 1.0
- Python 3.8+
- pip

### 2. Automated Setup

Run the automated setup script:

```bash
chmod +x setup_ml_pipeline.sh
./setup_ml_pipeline.sh
```

This script will:
- ✅ Check prerequisites
- ✅ Configure GCP project
- ✅ Set up Python environment
- ✅ Initialize Terraform
- ✅ Create default configuration
- ✅ Validate GCP setup
- ✅ Deploy infrastructure (with confirmation)
- ✅ Upload ML pipeline code

### 3. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Set up Python environment
python3 -m venv ml_pipeline_env
source ml_pipeline_env/bin/activate
pip install -r ml_pipeline/requirements.txt

# 2. Configure GCP
gcloud config set project voicecast-464815

# 3. Deploy infrastructure
cd terraform/ml_pipeline
terraform init
terraform plan
terraform apply

# 4. Upload ML pipeline code
gsutil cp -r ../../ml_pipeline/ gs://voicecast-464815-ml-pipeline-models/

# 5. Create default configuration
cd ../../
python ml_pipeline/run_data_pipeline.py --create-default-config
```

## 📊 Usage Examples

### Upload Data and Run Complete Pipeline

```bash
# 1. Upload audio files
gsutil cp your_audio_files/* gs://voicecast-464815-ml-pipeline-raw-data/

# 2. Trigger complete pipeline
curl -X POST https://YOUR_FUNCTION_URL/trigger-complete-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline_config": {
      "training": {
        "model_type": "transformer",
        "epochs": 50,
        "batch_size": 32
      }
    }
  }'

# 3. Check status
curl -X GET https://YOUR_FUNCTION_URL/pipeline-status?pipeline_id=YOUR_PIPELINE_ID

# 4. List models
curl -X GET https://YOUR_FUNCTION_URL/list-models
```

### Python Script Usage

```bash
# Data processing only
python ml_pipeline/run_data_pipeline.py --pipeline-id my-data-001

# Training only
python ml_pipeline/run_train_pipeline.py \
  --dataset-path gs://voicecast-464815-ml-pipeline-processed-data/datasets/dataset.pkl \
  --model-type transformer \
  --epochs 50

# Complete pipeline
python ml_pipeline/run_complete_pipeline.py \
  --model-type transformer \
  --epochs 50
```

## 🔧 Configuration

### Pipeline Configuration File

Create `/tmp/pipeline_config.yaml`:

```yaml
data_processing:
  batch_size: 32
  sample_rate: 22050
  augmentation:
    enabled: true
    noise_injection: true
    pitch_shifting: true

training:
  model_type: transformer  # or 'mlp'
  epochs: 100
  learning_rate: 0.001
  batch_size: 16
  early_stopping:
    patience: 10
```

### Environment Variables

```bash
export GCP_PROJECT_ID=voicecast-464815
export GCP_REGION=europe-west1
export PIPELINE_CONFIG_PATH=/tmp/pipeline_config.yaml
```

## 📁 Directory Structure

```
VoiceCast/
├── ml_pipeline/                     # ML Pipeline code
│   ├── data_processing/
│   │   └── data_processor.py       # Data processing pipeline
│   ├── model/
│   │   └── model_trainer.py        # Model training code
│   ├── pipeline_utils.py           # GCP utilities
│   ├── run_data_pipeline.py        # Data pipeline script
│   ├── run_train_pipeline.py       # Training pipeline script
│   ├── run_complete_pipeline.py    # Complete pipeline script
│   ├── requirements.txt            # Python dependencies
│   └── README_ML_PIPELINE.md       # Detailed documentation
├── terraform/ml_pipeline/          # Infrastructure as Code
│   ├── main.tf                     # Main Terraform configuration
│   ├── storage.tf                  # GCS buckets
│   ├── vertex_ai.tf                # Vertex AI resources
│   ├── cloud_functions.tf          # API functions
│   ├── compute.tf                  # Training instances
│   ├── iam.tf                      # Permissions
│   ├── functions/                  # Cloud Functions source
│   ├── scripts/                    # Startup scripts
│   └── README.md                   # Terraform documentation
└── setup_ml_pipeline.sh            # Automated setup script
```

## 🔍 Monitoring

### Check Pipeline Status

```bash
# Specific pipeline
curl -X GET https://YOUR_FUNCTION_URL/pipeline-status?pipeline_id=PIPELINE_ID

# All pipelines
curl -X GET https://YOUR_FUNCTION_URL/pipeline-status

# Summary format
curl -X GET https://YOUR_FUNCTION_URL/pipeline-status?format=summary
```

### Monitor Resources

```bash
# Check running instances
gcloud compute instances list --filter="labels.project=voicecast"

# Check bucket usage
gsutil du -sh gs://voicecast-464815-ml-pipeline-*

# Check Vertex AI jobs
gcloud ai custom-jobs list --region=europe-west1
```

## 💰 Cost Optimization

The pipeline is optimized for cost:

- **Preemptible Instances**: 70% cost reduction
- **Auto-scaling**: Scale to zero when idle
- **Storage Lifecycle**: Automatic tier transitions
- **T4 GPUs**: Most cost-effective for ML workloads

Estimated monthly cost: **$40-90** (optimized) vs $95-190 (standard)

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   gcloud auth application-default login
   ```

2. **API Not Enabled**
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

3. **No GPU Quota**
   ```bash
   gcloud compute project-info describe --format="value(quotas)"
   ```

4. **Pipeline Fails**
   ```bash
   # Check logs
   gcloud compute instances get-serial-port-output INSTANCE_NAME
   
   # Check function logs
   gcloud functions logs read --filter="resource.function_name=trigger-data-pipeline"
   ```

## 📚 Documentation

- **Detailed Guide**: `ml_pipeline/README_ML_PIPELINE.md`
- **Terraform Docs**: `terraform/ml_pipeline/README.md`
- **API Reference**: See README_ML_PIPELINE.md

## 🎯 Next Steps

1. **Upload Training Data**: Add audio files to raw data bucket
2. **Configure Pipeline**: Adjust settings in pipeline_config.yaml
3. **Run Pipeline**: Use API or Python scripts
4. **Monitor Progress**: Check status and logs
5. **Deploy Models**: Models automatically saved to Vertex AI

## 🔄 Development Workflow

```bash
# 1. Develop ML code
vim ml_pipeline/model/model_trainer.py

# 2. Test locally
python ml_pipeline/run_data_pipeline.py --validate-setup

# 3. Upload changes
gsutil cp -r ml_pipeline/ gs://voicecast-464815-ml-pipeline-models/

# 4. Run pipeline
curl -X POST https://YOUR_FUNCTION_URL/trigger-complete-pipeline

# 5. Check results
curl -X GET https://YOUR_FUNCTION_URL/list-models
```

## 🔗 API Endpoints

Once deployed, you'll have these endpoints:

- `POST /api/ml/trigger-data-pipeline` - Process raw audio data
- `POST /api/ml/trigger-training` - Train ML models
- `POST /api/ml/trigger-complete-pipeline` - End-to-end pipeline
- `GET /api/ml/pipeline-status` - Check pipeline status
- `GET /api/ml/list-models` - List available models

## 🎉 Success!

Your VoiceCast ML Pipeline is now ready to:
- Process audio data at scale
- Train ML models with GPUs
- Deploy models to Vertex AI
- Monitor all operations
- Optimize costs automatically

For detailed documentation, see `ml_pipeline/README_ML_PIPELINE.md`.