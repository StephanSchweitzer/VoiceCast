# Cloud Functions for ML pipeline API triggers

# Create Pub/Sub topic for pipeline events
resource "google_pubsub_topic" "ml_pipeline_events" {
  count = var.enable_pub_sub ? 1 : 0

  name = "${var.app_name}-ml-pipeline-events"

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# Create Pub/Sub subscription for pipeline events
resource "google_pubsub_subscription" "ml_pipeline_events_subscription" {
  count = var.enable_pub_sub ? 1 : 0

  name  = "${var.app_name}-ml-pipeline-events-subscription"
  topic = google_pubsub_topic.ml_pipeline_events[0].name

  # Message retention for 7 days
  message_retention_duration = "604800s"

  # Acknowledge deadline of 10 minutes
  ack_deadline_seconds = 600

  # Retry policy
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  # Dead letter policy
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.ml_pipeline_dead_letter[0].id
    max_delivery_attempts = 5
  }

  depends_on = [google_pubsub_topic.ml_pipeline_events]
}

# Create dead letter topic
resource "google_pubsub_topic" "ml_pipeline_dead_letter" {
  count = var.enable_pub_sub ? 1 : 0

  name = "${var.app_name}-ml-pipeline-dead-letter"

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# IAM binding for Pub/Sub publisher
resource "google_pubsub_topic_iam_member" "ml_pipeline_pubsub_publisher" {
  count = var.enable_pub_sub ? 1 : 0

  topic  = google_pubsub_topic.ml_pipeline_events[0].name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_pubsub_topic.ml_pipeline_events]
}

# IAM binding for Pub/Sub subscriber
resource "google_pubsub_subscription_iam_member" "ml_pipeline_pubsub_subscriber" {
  count = var.enable_pub_sub ? 1 : 0

  subscription = google_pubsub_subscription.ml_pipeline_events_subscription[0].name
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_pubsub_subscription.ml_pipeline_events_subscription]
}

# Cloud Function: Trigger Data Pipeline
resource "google_cloudfunctions2_function" "trigger_data_pipeline" {
  name     = "${var.app_name}-trigger-data-pipeline"
  location = var.region

  build_config {
    runtime     = "python39"
    entry_point = "trigger_data_pipeline"
    
    source {
      storage_source {
        bucket = google_storage_bucket.ml_functions_source.name
        object = google_storage_bucket_object.data_pipeline_function_source.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    min_instance_count = 0
    available_memory   = var.cloud_functions_memory
    timeout_seconds    = var.cloud_functions_timeout
    
    environment_variables = {
      GCP_PROJECT_ID = var.project_id
      GCP_REGION     = var.region
      RAW_DATA_BUCKET = google_storage_bucket.ml_raw_data.name
      PROCESSED_DATA_BUCKET = google_storage_bucket.ml_processed_data.name
      MODELS_BUCKET = google_storage_bucket.ml_models.name
      TEMP_BUCKET = google_storage_bucket.ml_temp.name
    }
    
    service_account_email = google_service_account.ml_pipeline_sa.email
  }

  depends_on = [
    google_project_service.ml_apis,
    google_storage_bucket_object.data_pipeline_function_source
  ]
}

# Cloud Function: Trigger Training Pipeline
resource "google_cloudfunctions2_function" "trigger_training_pipeline" {
  name     = "${var.app_name}-trigger-training-pipeline"
  location = var.region

  build_config {
    runtime     = "python39"
    entry_point = "trigger_training_pipeline"
    
    source {
      storage_source {
        bucket = google_storage_bucket.ml_functions_source.name
        object = google_storage_bucket_object.training_pipeline_function_source.name
      }
    }
  }

  service_config {
    max_instance_count = 5
    min_instance_count = 0
    available_memory   = var.cloud_functions_memory
    timeout_seconds    = var.cloud_functions_timeout
    
    environment_variables = {
      GCP_PROJECT_ID = var.project_id
      GCP_REGION     = var.region
      RAW_DATA_BUCKET = google_storage_bucket.ml_raw_data.name
      PROCESSED_DATA_BUCKET = google_storage_bucket.ml_processed_data.name
      MODELS_BUCKET = google_storage_bucket.ml_models.name
      TEMP_BUCKET = google_storage_bucket.ml_temp.name
    }
    
    service_account_email = google_service_account.ml_pipeline_sa.email
  }

  depends_on = [
    google_project_service.ml_apis,
    google_storage_bucket_object.training_pipeline_function_source
  ]
}

# Cloud Function: Trigger Complete Pipeline
resource "google_cloudfunctions2_function" "trigger_complete_pipeline" {
  name     = "${var.app_name}-trigger-complete-pipeline"
  location = var.region

  build_config {
    runtime     = "python39"
    entry_point = "trigger_complete_pipeline"
    
    source {
      storage_source {
        bucket = google_storage_bucket.ml_functions_source.name
        object = google_storage_bucket_object.complete_pipeline_function_source.name
      }
    }
  }

  service_config {
    max_instance_count = 3
    min_instance_count = 0
    available_memory   = var.cloud_functions_memory
    timeout_seconds    = var.cloud_functions_timeout
    
    environment_variables = {
      GCP_PROJECT_ID = var.project_id
      GCP_REGION     = var.region
      RAW_DATA_BUCKET = google_storage_bucket.ml_raw_data.name
      PROCESSED_DATA_BUCKET = google_storage_bucket.ml_processed_data.name
      MODELS_BUCKET = google_storage_bucket.ml_models.name
      TEMP_BUCKET = google_storage_bucket.ml_temp.name
    }
    
    service_account_email = google_service_account.ml_pipeline_sa.email
  }

  depends_on = [
    google_project_service.ml_apis,
    google_storage_bucket_object.complete_pipeline_function_source
  ]
}

# Cloud Function: Pipeline Status
resource "google_cloudfunctions2_function" "pipeline_status" {
  name     = "${var.app_name}-pipeline-status"
  location = var.region

  build_config {
    runtime     = "python39"
    entry_point = "get_pipeline_status"
    
    source {
      storage_source {
        bucket = google_storage_bucket.ml_functions_source.name
        object = google_storage_bucket_object.pipeline_status_function_source.name
      }
    }
  }

  service_config {
    max_instance_count = 20
    min_instance_count = 0
    available_memory   = "512Mi"
    timeout_seconds    = 60
    
    environment_variables = {
      GCP_PROJECT_ID = var.project_id
      GCP_REGION     = var.region
      MODELS_BUCKET = google_storage_bucket.ml_models.name
    }
    
    service_account_email = google_service_account.ml_pipeline_sa.email
  }

  depends_on = [
    google_project_service.ml_apis,
    google_storage_bucket_object.pipeline_status_function_source
  ]
}

# Cloud Function: List Models
resource "google_cloudfunctions2_function" "list_models" {
  name     = "${var.app_name}-list-models"
  location = var.region

  build_config {
    runtime     = "python39"
    entry_point = "list_models"
    
    source {
      storage_source {
        bucket = google_storage_bucket.ml_functions_source.name
        object = google_storage_bucket_object.list_models_function_source.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    min_instance_count = 0
    available_memory   = "512Mi"
    timeout_seconds    = 60
    
    environment_variables = {
      GCP_PROJECT_ID = var.project_id
      GCP_REGION     = var.region
      MODELS_BUCKET = google_storage_bucket.ml_models.name
    }
    
    service_account_email = google_service_account.ml_pipeline_sa.email
  }

  depends_on = [
    google_project_service.ml_apis,
    google_storage_bucket_object.list_models_function_source
  ]
}

# Create function source code archives
resource "google_storage_bucket_object" "data_pipeline_function_source" {
  name   = "function-source/data-pipeline-function.zip"
  bucket = google_storage_bucket.ml_functions_source.name
  source = data.archive_file.data_pipeline_function_source.output_path

  depends_on = [google_storage_bucket.ml_functions_source]
}

resource "google_storage_bucket_object" "training_pipeline_function_source" {
  name   = "function-source/training-pipeline-function.zip"
  bucket = google_storage_bucket.ml_functions_source.name
  source = data.archive_file.training_pipeline_function_source.output_path

  depends_on = [google_storage_bucket.ml_functions_source]
}

resource "google_storage_bucket_object" "complete_pipeline_function_source" {
  name   = "function-source/complete-pipeline-function.zip"
  bucket = google_storage_bucket.ml_functions_source.name
  source = data.archive_file.complete_pipeline_function_source.output_path

  depends_on = [google_storage_bucket.ml_functions_source]
}

resource "google_storage_bucket_object" "pipeline_status_function_source" {
  name   = "function-source/pipeline-status-function.zip"
  bucket = google_storage_bucket.ml_functions_source.name
  source = data.archive_file.pipeline_status_function_source.output_path

  depends_on = [google_storage_bucket.ml_functions_source]
}

resource "google_storage_bucket_object" "list_models_function_source" {
  name   = "function-source/list-models-function.zip"
  bucket = google_storage_bucket.ml_functions_source.name
  source = data.archive_file.list_models_function_source.output_path

  depends_on = [google_storage_bucket.ml_functions_source]
}

# Create function source archives
data "archive_file" "data_pipeline_function_source" {
  type        = "zip"
  output_path = "/tmp/data-pipeline-function.zip"
  
  source {
    content = templatefile("${path.module}/functions/data_pipeline_function.py", {
      project_id = var.project_id
      region     = var.region
    })
    filename = "main.py"
  }
  
  source {
    content = file("${path.module}/functions/requirements.txt")
    filename = "requirements.txt"
  }
}

data "archive_file" "training_pipeline_function_source" {
  type        = "zip"
  output_path = "/tmp/training-pipeline-function.zip"
  
  source {
    content = templatefile("${path.module}/functions/training_pipeline_function.py", {
      project_id = var.project_id
      region     = var.region
    })
    filename = "main.py"
  }
  
  source {
    content = file("${path.module}/functions/requirements.txt")
    filename = "requirements.txt"
  }
}

data "archive_file" "complete_pipeline_function_source" {
  type        = "zip"
  output_path = "/tmp/complete-pipeline-function.zip"
  
  source {
    content = templatefile("${path.module}/functions/complete_pipeline_function.py", {
      project_id = var.project_id
      region     = var.region
    })
    filename = "main.py"
  }
  
  source {
    content = file("${path.module}/functions/requirements.txt")
    filename = "requirements.txt"
  }
}

data "archive_file" "pipeline_status_function_source" {
  type        = "zip"
  output_path = "/tmp/pipeline-status-function.zip"
  
  source {
    content = templatefile("${path.module}/functions/pipeline_status_function.py", {
      project_id = var.project_id
      region     = var.region
    })
    filename = "main.py"
  }
  
  source {
    content = file("${path.module}/functions/requirements.txt")
    filename = "requirements.txt"
  }
}

data "archive_file" "list_models_function_source" {
  type        = "zip"
  output_path = "/tmp/list-models-function.zip"
  
  source {
    content = templatefile("${path.module}/functions/list_models_function.py", {
      project_id = var.project_id
      region     = var.region
    })
    filename = "main.py"
  }
  
  source {
    content = file("${path.module}/functions/requirements.txt")
    filename = "requirements.txt"
  }
}

# Make functions accessible via HTTP
resource "google_cloud_run_service_iam_member" "data_pipeline_function_invoker" {
  location = google_cloudfunctions2_function.trigger_data_pipeline.location
  service  = google_cloudfunctions2_function.trigger_data_pipeline.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
}

resource "google_cloud_run_service_iam_member" "training_pipeline_function_invoker" {
  location = google_cloudfunctions2_function.trigger_training_pipeline.location
  service  = google_cloudfunctions2_function.trigger_training_pipeline.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
}

resource "google_cloud_run_service_iam_member" "complete_pipeline_function_invoker" {
  location = google_cloudfunctions2_function.trigger_complete_pipeline.location
  service  = google_cloudfunctions2_function.trigger_complete_pipeline.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
}

resource "google_cloud_run_service_iam_member" "pipeline_status_function_invoker" {
  location = google_cloudfunctions2_function.pipeline_status.location
  service  = google_cloudfunctions2_function.pipeline_status.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "list_models_function_invoker" {
  location = google_cloudfunctions2_function.list_models.location
  service  = google_cloudfunctions2_function.list_models.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}