#!/bin/bash

# Training Instance Startup Script
# This script is executed when a training instance starts up

set -e

echo "Starting ML Pipeline Training Instance Setup..."

# Set environment variables
export GCP_PROJECT_ID="${project_id}"
export GCP_REGION="${region}"
export ML_MODELS_BUCKET="${models_bucket}"
export ML_PROCESSED_DATA_BUCKET="${processed_data_bucket}"
export DEBIAN_FRONTEND=noninteractive

# Update system
apt-get update -y
apt-get install -y python3-pip python3-venv git wget curl

# Install Google Cloud SDK
if ! command -v gcloud &> /dev/null; then
    echo "Installing Google Cloud SDK..."
    wget -q https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
    tar -xzf google-cloud-cli-linux-x86_64.tar.gz
    ./google-cloud-sdk/install.sh --quiet
    source ./google-cloud-sdk/path.bash.inc
    gcloud config set project $GCP_PROJECT_ID
fi

# Create virtual environment
python3 -m venv /opt/ml_pipeline_env
source /opt/ml_pipeline_env/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install google-cloud-storage google-cloud-aiplatform
pip install torch torchaudio transformers datasets librosa
pip install numpy pandas scikit-learn tqdm pyyaml

# Download ML pipeline code
echo "Downloading ML pipeline code..."
mkdir -p /opt/ml_pipeline
gsutil -m cp -r gs://$ML_MODELS_BUCKET/ml_pipeline/* /opt/ml_pipeline/ || {
    echo "Failed to download ML pipeline code. Creating basic structure..."
    mkdir -p /opt/ml_pipeline/data_processing
    mkdir -p /opt/ml_pipeline/model
}

# Set permissions
chmod +x /opt/ml_pipeline/*.py

# Create log directory
mkdir -p /var/log/ml_pipeline

# Function to run training pipeline
run_training_pipeline() {
    local dataset_path=$1
    local pipeline_id=$2
    
    echo "Running training pipeline..."
    echo "Dataset path: $dataset_path"
    echo "Pipeline ID: $pipeline_id"
    
    cd /opt/ml_pipeline
    
    # Check if dataset exists
    if gsutil ls "$dataset_path" &> /dev/null; then
        echo "Dataset found, starting training..."
        
        # Run training pipeline
        python3 run_train_pipeline.py \
            --dataset-path "$dataset_path" \
            --pipeline-id "$pipeline_id" \
            --config-path /tmp/pipeline_config.yaml \
            > /var/log/ml_pipeline/training_$pipeline_id.log 2>&1
        
        echo "Training pipeline completed"
    else
        echo "Dataset not found: $dataset_path"
        exit 1
    fi
}

# Check if this is a training instance
if [ "$#" -ge 2 ]; then
    echo "Training instance detected"
    DATASET_PATH=$1
    PIPELINE_ID=$2
    
    # Run training pipeline
    run_training_pipeline "$DATASET_PATH" "$PIPELINE_ID"
else
    echo "No training parameters provided. Instance ready for manual training."
fi

# Keep instance running for manual operations
echo "Training instance setup complete. Instance is ready."

# Optional: Auto-shutdown after completion (uncomment if desired)
# echo "Shutting down instance in 5 minutes..."
# shutdown -h +5