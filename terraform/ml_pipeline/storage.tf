# ML Pipeline specific storage buckets
# These are separate from the main VoiceCast buckets

# Raw data bucket for ML pipeline
resource "google_storage_bucket" "ml_raw_data" {
  name          = "${var.project_id}-ml-pipeline-raw-data"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  # Versioning for data tracking
  versioning {
    enabled = true
  }

  # Lifecycle management for cost optimization
  dynamic "lifecycle_rule" {
    for_each = var.enable_lifecycle_management ? [1] : []
    content {
      condition {
        age = var.data_retention_days
      }
      action {
        type = "Delete"
      }
    }
  }

  # Lifecycle rule for old versions
  dynamic "lifecycle_rule" {
    for_each = var.enable_lifecycle_management ? [1] : []
    content {
      condition {
        num_newer_versions = 3
      }
      action {
        type = "Delete"
      }
    }
  }

  # Move to nearline storage after 30 days
  dynamic "lifecycle_rule" {
    for_each = var.enable_cost_optimization ? [1] : []
    content {
      condition {
        age = 30
      }
      action {
        type          = "SetStorageClass"
        storage_class = "NEARLINE"
      }
    }
  }

  # Move to coldline storage after 90 days
  dynamic "lifecycle_rule" {
    for_each = var.enable_cost_optimization ? [1] : []
    content {
      condition {
        age = 90
      }
      action {
        type          = "SetStorageClass"
        storage_class = "COLDLINE"
      }
    }
  }

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# Processed data bucket for ML pipeline
resource "google_storage_bucket" "ml_processed_data" {
  name          = "${var.project_id}-ml-pipeline-processed-data"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  # Versioning for data tracking
  versioning {
    enabled = true
  }

  # Lifecycle management for cost optimization
  dynamic "lifecycle_rule" {
    for_each = var.enable_lifecycle_management ? [1] : []
    content {
      condition {
        age = var.data_retention_days
      }
      action {
        type = "Delete"
      }
    }
  }

  # Lifecycle rule for old versions
  dynamic "lifecycle_rule" {
    for_each = var.enable_lifecycle_management ? [1] : []
    content {
      condition {
        num_newer_versions = 5
      }
      action {
        type = "Delete"
      }
    }
  }

  # Move to nearline storage after 30 days
  dynamic "lifecycle_rule" {
    for_each = var.enable_cost_optimization ? [1] : []
    content {
      condition {
        age = 30
      }
      action {
        type          = "SetStorageClass"
        storage_class = "NEARLINE"
      }
    }
  }

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# Models bucket for ML pipeline
resource "google_storage_bucket" "ml_models" {
  name          = "${var.project_id}-ml-pipeline-models"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  # Versioning for model tracking
  versioning {
    enabled = true
  }

  # Lifecycle management for models
  dynamic "lifecycle_rule" {
    for_each = var.enable_lifecycle_management ? [1] : []
    content {
      condition {
        age = var.model_retention_days
      }
      action {
        type = "Delete"
      }
    }
  }

  # Keep more versions for models
  dynamic "lifecycle_rule" {
    for_each = var.enable_lifecycle_management ? [1] : []
    content {
      condition {
        num_newer_versions = 10
      }
      action {
        type = "Delete"
      }
    }
  }

  # Move to nearline storage after 60 days
  dynamic "lifecycle_rule" {
    for_each = var.enable_cost_optimization ? [1] : []
    content {
      condition {
        age = 60
      }
      action {
        type          = "SetStorageClass"
        storage_class = "NEARLINE"
      }
    }
  }

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# Temporary bucket for pipeline artifacts
resource "google_storage_bucket" "ml_temp" {
  name          = "${var.project_id}-ml-pipeline-temp"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  # Aggressive cleanup for temp bucket
  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }

  # Delete incomplete multipart uploads after 1 day
  lifecycle_rule {
    condition {
      age = 1
    }
    action {
      type = "AbortIncompleteMultipartUpload"
    }
  }

  labels = merge(var.labels, {
    type = "temporary"
  })

  depends_on = [google_project_service.ml_apis]
}

# Cloud Functions source bucket
resource "google_storage_bucket" "ml_functions_source" {
  name          = "${var.project_id}-ml-pipeline-functions-source"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  # Versioning for function source code
  versioning {
    enabled = true
  }

  # Lifecycle management for function source
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  # Keep only latest 5 versions
  lifecycle_rule {
    condition {
      num_newer_versions = 5
    }
    action {
      type = "Delete"
    }
  }

  labels = merge(var.labels, {
    type = "function-source"
  })

  depends_on = [google_project_service.ml_apis]
}

# IAM bindings for ML pipeline service account on buckets
resource "google_storage_bucket_iam_member" "ml_pipeline_bucket_permissions" {
  for_each = toset([
    google_storage_bucket.ml_raw_data.name,
    google_storage_bucket.ml_processed_data.name,
    google_storage_bucket.ml_models.name,
    google_storage_bucket.ml_temp.name,
    google_storage_bucket.ml_functions_source.name
  ])

  bucket = each.value
  role   = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Create bucket notifications for monitoring
resource "google_storage_notification" "ml_raw_data_notification" {
  count = var.enable_pub_sub ? 1 : 0

  bucket         = google_storage_bucket.ml_raw_data.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.ml_pipeline_events[0].id
  event_types    = ["OBJECT_FINALIZE", "OBJECT_DELETE"]

  depends_on = [google_pubsub_topic_iam_member.ml_pipeline_pubsub_publisher]
}

resource "google_storage_notification" "ml_processed_data_notification" {
  count = var.enable_pub_sub ? 1 : 0

  bucket         = google_storage_bucket.ml_processed_data.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.ml_pipeline_events[0].id
  event_types    = ["OBJECT_FINALIZE", "OBJECT_DELETE"]

  depends_on = [google_pubsub_topic_iam_member.ml_pipeline_pubsub_publisher]
}

resource "google_storage_notification" "ml_models_notification" {
  count = var.enable_pub_sub ? 1 : 0

  bucket         = google_storage_bucket.ml_models.name
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.ml_pipeline_events[0].id
  event_types    = ["OBJECT_FINALIZE", "OBJECT_DELETE"]

  depends_on = [google_pubsub_topic_iam_member.ml_pipeline_pubsub_publisher]
}