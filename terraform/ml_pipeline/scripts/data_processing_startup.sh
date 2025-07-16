#!/bin/bash

# Data Processing Instance Startup Script
# This script is executed when a data processing instance starts up

set -e

echo "Starting ML Pipeline Data Processing Instance Setup..."

# Set environment variables
export GCP_PROJECT_ID="${project_id}"
export GCP_REGION="${region}"
export ML_RAW_DATA_BUCKET="${raw_data_bucket}"
export ML_PROCESSED_DATA_BUCKET="${processed_data_bucket}"
export ML_MODELS_BUCKET="${models_bucket}"
export DEBIAN_FRONTEND=noninteractive

# Update system
apt-get update -y
apt-get install -y python3-pip python3-venv git wget curl ffmpeg

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
pip install librosa soundfile resampy pydub
pip install numpy pandas scikit-learn tqdm pyyaml
pip install datasets transformers

# Install audio processing dependencies
apt-get install -y libsndfile1 libsndfile1-dev
apt-get install -y sox libsox-fmt-all

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

# Create temporary directories
mkdir -p /tmp/raw_audio
mkdir -p /tmp/processed_audio

# Function to run data processing pipeline
run_data_processing_pipeline() {
    local pipeline_id=$1
    
    echo "Running data processing pipeline..."
    echo "Pipeline ID: $pipeline_id"
    
    cd /opt/ml_pipeline
    
    # Check if raw data exists
    if gsutil ls gs://$ML_RAW_DATA_BUCKET/ | grep -q "\\.wav\\|\\.mp3\\|\\.flac\\|\\.m4a\\|\\.ogg"; then
        echo "Raw audio data found, starting processing..."
        
        # Run data processing pipeline
        python3 run_data_pipeline.py \
            --pipeline-id "$pipeline_id" \
            --config-path /tmp/pipeline_config.yaml \
            > /var/log/ml_pipeline/data_processing_$pipeline_id.log 2>&1
        
        echo "Data processing pipeline completed"
    else
        echo "No audio files found in raw data bucket: gs://$ML_RAW_DATA_BUCKET/"
        exit 1
    fi
}

# Function to validate audio files
validate_audio_files() {
    echo "Validating audio files in raw data bucket..."
    
    local file_count=0
    local valid_count=0
    
    # List and validate each audio file
    while read -r file; do
        if [[ "$file" =~ \.(wav|mp3|flac|m4a|ogg)$ ]]; then
            ((file_count++))
            
            # Download file temporarily for validation
            local temp_file="/tmp/temp_audio_$(basename "$file")"
            if gsutil cp "$file" "$temp_file" 2>/dev/null; then
                # Basic validation using ffprobe
                if ffprobe -v quiet -show_format "$temp_file" 2>/dev/null; then
                    ((valid_count++))
                    echo "✓ Valid: $(basename "$file")"
                else
                    echo "✗ Invalid: $(basename "$file")"
                fi
                rm -f "$temp_file"
            else
                echo "✗ Cannot download: $(basename "$file")"
            fi
        fi
    done < <(gsutil ls gs://$ML_RAW_DATA_BUCKET/)
    
    echo "Audio validation complete: $valid_count/$file_count files valid"
    
    if [ $valid_count -eq 0 ]; then
        echo "No valid audio files found!"
        exit 1
    fi
}

# Check if this is a data processing instance
if [ "$#" -ge 1 ]; then
    echo "Data processing instance detected"
    PIPELINE_ID=$1
    
    # Validate audio files first
    validate_audio_files
    
    # Run data processing pipeline
    run_data_processing_pipeline "$PIPELINE_ID"
else
    echo "No pipeline ID provided. Instance ready for manual processing."
fi

# Keep instance running for manual operations
echo "Data processing instance setup complete. Instance is ready."

# Optional: Auto-shutdown after completion (uncomment if desired)
# echo "Shutting down instance in 5 minutes..."
# shutdown -h +5