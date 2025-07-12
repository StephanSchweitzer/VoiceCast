# storage.tf - Audio storage buckets for VoiceCast

# Reference audio samples bucket
resource "google_storage_bucket" "reference_audios" {
  name          = "${var.project_id}-${var.app_name}-reference-audios"
  location      = var.region
  force_destroy = true # For development - easier cleanup

  uniform_bucket_level_access = true

  # CORS configuration for web app access
  cors {
    origin          = ["*"] # For development - specify your domain in production
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Versioning for reference files
  versioning {
    enabled = true
  }

  depends_on = [google_project_service.apis]
}

# Generated audio outputs bucket
resource "google_storage_bucket" "generated_audios" {
  name          = "${var.project_id}-${var.app_name}-generated-audios"
  location      = var.region
  force_destroy = true # For development

  uniform_bucket_level_access = true

  # CORS configuration
  cors {
    origin          = ["*"]
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Auto-cleanup old generated files to manage costs
  lifecycle_rule {
    condition {
      age = 30 # Delete files older than 30 days
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [google_project_service.apis]
}

# Training datasets bucket (if needed for ML models)
resource "google_storage_bucket" "training_datasets" {
  name          = "${var.project_id}-${var.app_name}-datasets"
  location      = var.region
  force_destroy = true # For development

  uniform_bucket_level_access = true

  # No CORS needed for training data
  # Versioning for dataset management
  versioning {
    enabled = true
  }

  depends_on = [google_project_service.apis]
}