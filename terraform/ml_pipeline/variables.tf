# ML Pipeline Variables

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "us-central1-a"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "voicecast"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ML Pipeline specific variables
variable "ml_pipeline_bucket_name" {
  description = "Name for the ML pipeline GCS bucket"
  type        = string
  default     = ""
}

variable "vertex_ai_model_name" {
  description = "Name for the Vertex AI model"
  type        = string
  default     = "voicecast-emotion-model"
}

variable "training_instance_type" {
  description = "Machine type for training instance"
  type        = string
  default     = "n1-standard-4"
}

variable "gpu_type" {
  description = "GPU type for training"
  type        = string
  default     = "NVIDIA_TESLA_K80"
}

variable "gpu_count" {
  description = "Number of GPUs for training"
  type        = number
  default     = 1
}

variable "preemptible" {
  description = "Use preemptible instances for cost optimization"
  type        = bool
  default     = true
}

variable "cloud_run_image" {
  description = "Container image for Cloud Run ML pipeline API"
  type        = string
  default     = "gcr.io/google-samples/hello-app:1.0"
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "cloud_run_memory" {
  description = "Memory allocation for Cloud Run instances"
  type        = string
  default     = "2Gi"
}

variable "cloud_run_cpu" {
  description = "CPU allocation for Cloud Run instances"
  type        = string
  default     = "1000m"
}

variable "bucket_lifecycle_days" {
  description = "Number of days after which to delete old objects"
  type        = number
  default     = 30
}

variable "allow_public_access" {
  description = "Allow public access to the Cloud Run service"
  type        = bool
  default     = false
}