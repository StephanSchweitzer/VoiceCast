variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "voicecast-464815"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "europe-west9"
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
    "inference_api/**",
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