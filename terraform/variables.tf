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

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth secret key"
  type        = string
  sensitive   = true
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "voicecast"
}

variable "github_repo_owner" {
  description = "GitHub repository owner (username or organization)"
  type        = string
}

variable "github_repo_name" {
  description = "GitHub repository name"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to build from"
  type        = string
  default     = "main"
}

variable "trigger_on_push" {
  description = "Whether to trigger build on git push"
  type        = bool
  default     = true
}

variable "app_file_patterns" {
  description = "File patterns that should trigger app (frontend) rebuilds"
  type        = list(string)
  default = [
    "src/**",
    "next.config.js",
    "package.json",
    "package-lock.json",
    "Dockerfile",
    "middleware.ts",
    "tailwind.config.ts",
    "tsconfig.json",
    "postcss.config.js"
  ]
}

variable "api_file_patterns" {
  description = "File patterns that should trigger API (backend) rebuilds"
  type        = list(string)
  default = [
    "tts_api/**",
  ]
}

variable "model_file_patterns" {
  description = "File patterns that should trigger model pipeline rebuilds"
  type        = list(string)
  default = [
    "voicecast_model/**",
  ]
}

variable "ignored_file_patterns" {
  description = "File patterns that should NOT trigger any builds"
  type        = list(string)
  default = [
    "terraform/**",
    ".github/**",
    "README.md",
    "**/*.md",
    ".gitignore",
    "LICENSE",
    ".env.example",
    "**/.DS_Store",
  ]
}

variable "github_personal_access_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}

variable "github_app_installation_id" {
  description = "GitHub App Installation ID"
  type        = number
}

# ML Pipeline Variables
variable "ml_pipeline_enabled" {
  description = "Enable ML Pipeline infrastructure"
  type        = bool
  default     = false
}

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
  description = "Allow public access to the ML pipeline API"
  type        = bool
  default     = false
}

variable "ml_environment" {
  description = "Environment for ML pipeline (dev, staging, prod)"
  type        = string
  default     = "dev"
}