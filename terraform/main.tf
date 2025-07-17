terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.43.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "apis" {
  for_each = toset([
    "sqladmin.googleapis.com",
    "run.googleapis.com",
    "vpcaccess.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "storage.googleapis.com",
    "cloudbuild.googleapis.com",
    "iamcredentials.googleapis.com",
    "aiplatform.googleapis.com",
    "notebooks.googleapis.com",
    "cloudscheduler.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.app_name}-db-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "${var.app_name}-nextauth-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = var.nextauth_secret
}

# ML Pipeline Module
module "ml_pipeline" {
  count  = var.ml_pipeline_enabled ? 1 : 0
  source = "./ml_pipeline"

  # Pass through required variables
  project_id = var.project_id
  region     = var.region
  app_name   = var.app_name

  # ML Pipeline specific variables
  environment             = var.ml_environment
  ml_pipeline_bucket_name = var.ml_pipeline_bucket_name
  vertex_ai_model_name    = var.vertex_ai_model_name
  training_instance_type  = var.training_instance_type
  gpu_type                = var.gpu_type
  gpu_count               = var.gpu_count
  preemptible             = var.preemptible
  cloud_run_max_instances = var.cloud_run_max_instances
  cloud_run_memory        = var.cloud_run_memory
  cloud_run_cpu           = var.cloud_run_cpu
  bucket_lifecycle_days   = var.bucket_lifecycle_days
  allow_public_access     = var.allow_public_access
}