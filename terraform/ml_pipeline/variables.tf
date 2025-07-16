# Variables for ML pipeline infrastructure
# These inherit from the main terraform configuration

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "voicecast-464815"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "europe-west1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "voicecast"
}

# ML Pipeline specific variables
variable "ml_pipeline_enabled" {
  description = "Enable ML pipeline infrastructure"
  type        = bool
  default     = true
}

variable "enable_gpu_training" {
  description = "Enable GPU instances for training"
  type        = bool
  default     = true
}

variable "gpu_type" {
  description = "GPU type for training instances"
  type        = string
  default     = "nvidia-tesla-t4"
  validation {
    condition = contains([
      "nvidia-tesla-t4",
      "nvidia-tesla-k80",
      "nvidia-tesla-p4",
      "nvidia-tesla-v100",
      "nvidia-tesla-p100"
    ], var.gpu_type)
    error_message = "GPU type must be one of: nvidia-tesla-t4, nvidia-tesla-k80, nvidia-tesla-p4, nvidia-tesla-v100, nvidia-tesla-p100"
  }
}

variable "gpu_count" {
  description = "Number of GPUs per training instance"
  type        = number
  default     = 1
  validation {
    condition     = var.gpu_count >= 1 && var.gpu_count <= 4
    error_message = "GPU count must be between 1 and 4"
  }
}

variable "training_machine_type" {
  description = "Machine type for training instances"
  type        = string
  default     = "n1-standard-4"
}

variable "use_preemptible_instances" {
  description = "Use preemptible instances for cost optimization"
  type        = bool
  default     = true
}

variable "max_training_instances" {
  description = "Maximum number of training instances"
  type        = number
  default     = 2
}

variable "training_disk_size" {
  description = "Disk size for training instances (GB)"
  type        = number
  default     = 100
}

variable "training_disk_type" {
  description = "Disk type for training instances"
  type        = string
  default     = "pd-ssd"
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for training resources"
  type        = bool
  default     = true
}

variable "vertex_ai_region" {
  description = "Vertex AI region (can be different from main region)"
  type        = string
  default     = "europe-west1"
}

variable "enable_monitoring" {
  description = "Enable monitoring and logging for ML pipeline"
  type        = bool
  default     = true
}

variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "data_retention_days" {
  description = "Data retention period in days"
  type        = number
  default     = 90
}

variable "model_retention_days" {
  description = "Model retention period in days"
  type        = number
  default     = 365
}

variable "enable_lifecycle_management" {
  description = "Enable automatic lifecycle management for buckets"
  type        = bool
  default     = true
}

variable "cloud_functions_timeout" {
  description = "Cloud Functions timeout in seconds"
  type        = number
  default     = 3600
}

variable "cloud_functions_memory" {
  description = "Cloud Functions memory allocation"
  type        = string
  default     = "2Gi"
}

variable "enable_secret_manager" {
  description = "Enable Secret Manager for ML pipeline credentials"
  type        = bool
  default     = true
}

variable "notification_email" {
  description = "Email for pipeline notifications"
  type        = string
  default     = ""
}

variable "enable_notifications" {
  description = "Enable email notifications for pipeline events"
  type        = bool
  default     = false
}

variable "api_gateway_enabled" {
  description = "Enable API Gateway for ML pipeline endpoints"
  type        = bool
  default     = true
}

variable "enable_cors" {
  description = "Enable CORS for API endpoints"
  type        = bool
  default     = true
}

variable "allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "enable_authentication" {
  description = "Enable authentication for API endpoints"
  type        = bool
  default     = true
}

variable "docker_image_tag" {
  description = "Docker image tag for ML pipeline functions"
  type        = string
  default     = "latest"
}

variable "enable_vpc_connector" {
  description = "Enable VPC connector for Cloud Functions"
  type        = bool
  default     = false
}

variable "vpc_connector_name" {
  description = "Name of the VPC connector"
  type        = string
  default     = ""
}

variable "enable_cloud_scheduler" {
  description = "Enable Cloud Scheduler for periodic pipeline runs"
  type        = bool
  default     = false
}

variable "scheduler_timezone" {
  description = "Timezone for Cloud Scheduler"
  type        = string
  default     = "Europe/London"
}

variable "enable_pub_sub" {
  description = "Enable Pub/Sub for pipeline events"
  type        = bool
  default     = true
}

variable "enable_eventarc" {
  description = "Enable Eventarc for event-driven pipeline triggers"
  type        = bool
  default     = true
}

variable "labels" {
  description = "Labels to apply to all resources"
  type        = map(string)
  default = {
    project   = "voicecast"
    component = "ml-pipeline"
    environment = "production"
    cost-center = "ml-ops"
  }
}