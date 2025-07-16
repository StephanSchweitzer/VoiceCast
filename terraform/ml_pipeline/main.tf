terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.43.0"
    }
  }
}

# Use the same provider configuration as the main project
provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs for ML pipeline
resource "google_project_service" "ml_apis" {
  for_each = toset([
    "aiplatform.googleapis.com",
    "ml.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudscheduler.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "pubsub.googleapis.com",
    "eventarc.googleapis.com",
    "run.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}

# Create a dedicated service account for ML pipeline
resource "google_service_account" "ml_pipeline_sa" {
  account_id   = "${var.app_name}-ml-pipeline"
  display_name = "ML Pipeline Service Account"
  description  = "Service account for ML pipeline operations"

  depends_on = [google_project_service.ml_apis]
}

# Grant necessary permissions to the ML pipeline service account
resource "google_project_iam_member" "ml_pipeline_permissions" {
  for_each = toset([
    "roles/storage.admin",
    "roles/aiplatform.admin",
    "roles/ml.admin",
    "roles/cloudfunctions.admin",
    "roles/compute.admin",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
    "roles/pubsub.admin",
    "roles/secretmanager.accessor"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Create service account key for ML pipeline
resource "google_service_account_key" "ml_pipeline_key" {
  service_account_id = google_service_account.ml_pipeline_sa.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}