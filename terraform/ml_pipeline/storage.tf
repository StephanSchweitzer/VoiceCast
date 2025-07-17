# GCS Storage for ML Pipeline

locals {
  bucket_name = var.ml_pipeline_bucket_name != "" ? var.ml_pipeline_bucket_name : "${var.project_id}-${var.app_name}-ml-pipeline-${var.environment}"
}

# GCS bucket for processed data and trained models
resource "google_storage_bucket" "ml_pipeline_bucket" {
  name          = local.bucket_name
  location      = var.region
  force_destroy = true

  # Versioning for model artifacts
  versioning {
    enabled = true
  }

  # CORS configuration for web access
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Lifecycle management for automatic cleanup
  lifecycle_rule {
    condition {
      age = var.bucket_lifecycle_days
    }
    action {
      type = "Delete"
    }
  }

  # Lifecycle rule for old versions
  lifecycle_rule {
    condition {
      num_newer_versions = 5
    }
    action {
      type = "Delete"
    }
  }

  # Lifecycle rule for multipart uploads
  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  # Public access prevention
  public_access_prevention = "enforced"

  # Labels for organization
  labels = {
    purpose     = "ml-pipeline"
    environment = var.environment
    project     = var.app_name
  }

  depends_on = [google_project_service.ml_pipeline_apis]
}

# Bucket folders for organization
resource "google_storage_bucket_object" "processed_data_folder" {
  name    = "processed-data/"
  bucket  = google_storage_bucket.ml_pipeline_bucket.name
  content = " "
}

resource "google_storage_bucket_object" "models_folder" {
  name    = "models/"
  bucket  = google_storage_bucket.ml_pipeline_bucket.name
  content = " "
}

resource "google_storage_bucket_object" "training_data_folder" {
  name    = "training-data/"
  bucket  = google_storage_bucket.ml_pipeline_bucket.name
  content = " "
}

resource "google_storage_bucket_object" "logs_folder" {
  name    = "logs/"
  bucket  = google_storage_bucket.ml_pipeline_bucket.name
  content = " "
}