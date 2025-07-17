# ML Pipeline Module
# This module creates the infrastructure for the ML pipeline including Vertex AI, GCS, and Cloud Run

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.43.0"
    }
  }
}

# Enable required APIs for ML Pipeline
resource "google_project_service" "ml_pipeline_apis" {
  for_each = toset([
    "aiplatform.googleapis.com",
    "compute.googleapis.com",
    "notebooks.googleapis.com",
    "storage.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudscheduler.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}