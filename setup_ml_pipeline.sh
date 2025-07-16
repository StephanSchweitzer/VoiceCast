#!/bin/bash

# VoiceCast ML Pipeline Setup Script
# This script sets up the complete ML pipeline infrastructure and dependencies

set -e

echo "========================================"
echo "VoiceCast ML Pipeline Setup"
echo "========================================"

# Configuration
PROJECT_ID="voicecast-464815"
REGION="europe-west1"
TERRAFORM_DIR="terraform/ml_pipeline"
ML_PIPELINE_DIR="ml_pipeline"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if python3 is installed
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed. Please install it first."
        exit 1
    fi
    
    # Check if pip is installed
    if ! command -v pip &> /dev/null; then
        log_error "pip is not installed. Please install it first."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

setup_gcp_project() {
    log_info "Setting up GCP project..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Check if project exists
    if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
        log_error "Project $PROJECT_ID does not exist or you don't have access to it."
        exit 1
    fi
    
    log_info "GCP project setup complete ✓"
}

setup_python_environment() {
    log_info "Setting up Python environment..."
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "ml_pipeline_env" ]; then
        python3 -m venv ml_pipeline_env
        log_info "Created virtual environment"
    fi
    
    # Activate virtual environment
    source ml_pipeline_env/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install ML pipeline dependencies
    if [ -f "$ML_PIPELINE_DIR/requirements.txt" ]; then
        pip install -r $ML_PIPELINE_DIR/requirements.txt
        log_info "Installed ML pipeline dependencies"
    else
        log_warning "requirements.txt not found in $ML_PIPELINE_DIR"
    fi
    
    log_info "Python environment setup complete ✓"
}

setup_terraform() {
    log_info "Setting up Terraform..."
    
    # Navigate to terraform directory
    cd $TERRAFORM_DIR
    
    # Initialize Terraform
    terraform init
    
    # Validate Terraform configuration
    terraform validate
    
    log_info "Terraform setup complete ✓"
    
    # Go back to root directory
    cd ../../
}

create_default_config() {
    log_info "Creating default configuration..."
    
    # Create default pipeline configuration
    python3 $ML_PIPELINE_DIR/run_data_pipeline.py --create-default-config
    
    log_info "Default configuration created ✓"
}

validate_gcp_setup() {
    log_info "Validating GCP setup..."
    
    # Validate GCP setup
    python3 $ML_PIPELINE_DIR/run_data_pipeline.py --validate-setup
    
    log_info "GCP setup validation complete ✓"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    
    # Ask for confirmation
    read -p "Do you want to deploy the Terraform infrastructure? (y/n): " confirm
    if [[ $confirm != [yY] ]]; then
        log_warning "Infrastructure deployment skipped"
        return
    fi
    
    # Navigate to terraform directory
    cd $TERRAFORM_DIR
    
    # Plan deployment
    terraform plan -out=tfplan
    
    # Ask for final confirmation
    read -p "Review the plan above. Deploy infrastructure? (y/n): " final_confirm
    if [[ $final_confirm != [yY] ]]; then
        log_warning "Infrastructure deployment cancelled"
        cd ../../
        return
    fi
    
    # Apply deployment
    terraform apply tfplan
    
    log_info "Infrastructure deployment complete ✓"
    
    # Save outputs
    terraform output -json > terraform_outputs.json
    
    # Go back to root directory
    cd ../../
}

upload_ml_pipeline_code() {
    log_info "Uploading ML pipeline code..."
    
    # Get models bucket name from terraform outputs
    if [ -f "$TERRAFORM_DIR/terraform_outputs.json" ]; then
        MODELS_BUCKET=$(cat $TERRAFORM_DIR/terraform_outputs.json | python3 -c "import sys, json; print(json.load(sys.stdin)['ml_models_bucket_name']['value'])")
        
        # Upload ML pipeline code
        gsutil -m cp -r $ML_PIPELINE_DIR/ gs://$MODELS_BUCKET/
        
        log_info "ML pipeline code uploaded to gs://$MODELS_BUCKET/ ✓"
    else
        log_warning "Terraform outputs not found. Skipping code upload."
    fi
}

display_setup_summary() {
    log_info "Setup Summary:"
    
    echo ""
    echo "✓ Prerequisites checked"
    echo "✓ GCP project configured"
    echo "✓ Python environment setup"
    echo "✓ Terraform initialized"
    echo "✓ Default configuration created"
    echo "✓ GCP setup validated"
    
    if [ -f "$TERRAFORM_DIR/terraform_outputs.json" ]; then
        echo "✓ Infrastructure deployed"
        echo "✓ ML pipeline code uploaded"
        
        echo ""
        echo "================================================"
        echo "ML Pipeline Ready!"
        echo "================================================"
        
        # Display API endpoints
        echo ""
        echo "API Endpoints:"
        ENDPOINTS=$(cat $TERRAFORM_DIR/terraform_outputs.json | python3 -c "
import sys, json
outputs = json.load(sys.stdin)
endpoints = outputs['ml_pipeline_api_endpoints']['value']
for name, url in endpoints.items():
    print(f'  {name}: {url}')
")
        echo "$ENDPOINTS"
        
        echo ""
        echo "Next Steps:"
        echo "1. Upload audio files to raw data bucket:"
        RAW_BUCKET=$(cat $TERRAFORM_DIR/terraform_outputs.json | python3 -c "import sys, json; print(json.load(sys.stdin)['ml_raw_data_bucket_name']['value'])")
        echo "   gsutil cp your_audio_files/* gs://$RAW_BUCKET/"
        echo ""
        echo "2. Trigger data pipeline:"
        DATA_PIPELINE_URL=$(cat $TERRAFORM_DIR/terraform_outputs.json | python3 -c "import sys, json; print(json.load(sys.stdin)['ml_pipeline_api_endpoints']['value']['trigger_data_pipeline'])")
        echo "   curl -X POST $DATA_PIPELINE_URL"
        echo ""
        echo "3. Check pipeline status:"
        STATUS_URL=$(cat $TERRAFORM_DIR/terraform_outputs.json | python3 -c "import sys, json; print(json.load(sys.stdin)['ml_pipeline_api_endpoints']['value']['pipeline_status'])")
        echo "   curl -X GET $STATUS_URL"
        
    else
        echo "✗ Infrastructure not deployed"
        echo "✗ ML pipeline code not uploaded"
        
        echo ""
        echo "To complete setup:"
        echo "1. Run: cd $TERRAFORM_DIR && terraform apply"
        echo "2. Upload ML pipeline code to GCS"
    fi
    
    echo ""
    echo "Documentation: $ML_PIPELINE_DIR/README_ML_PIPELINE.md"
    echo "Terraform docs: $TERRAFORM_DIR/README.md"
}

# Main execution
main() {
    log_info "Starting VoiceCast ML Pipeline Setup..."
    
    # Check if we're in the right directory
    if [ ! -d "$ML_PIPELINE_DIR" ] || [ ! -d "$TERRAFORM_DIR" ]; then
        log_error "Please run this script from the VoiceCast root directory"
        exit 1
    fi
    
    # Run setup steps
    check_prerequisites
    setup_gcp_project
    setup_python_environment
    setup_terraform
    create_default_config
    validate_gcp_setup
    deploy_infrastructure
    upload_ml_pipeline_code
    display_setup_summary
    
    log_info "Setup complete! 🎉"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deploy)
            SKIP_DEPLOY=true
            shift
            ;;
        --project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-deploy     Skip infrastructure deployment"
            echo "  --project-id      GCP project ID (default: voicecast-464815)"
            echo "  --region          GCP region (default: europe-west1)"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main