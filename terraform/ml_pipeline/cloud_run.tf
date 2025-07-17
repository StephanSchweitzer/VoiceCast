# Cloud Run Service for ML Pipeline API

# Cloud Run service for ML Pipeline API
resource "google_cloud_run_v2_service" "ml_pipeline_api" {
  name     = "${var.app_name}-ml-pipeline-api"
  location = var.region

  template {
    # Service account
    service_account = google_service_account.ml_api_sa.email

    # Scaling configuration
    scaling {
      min_instance_count = 0
      max_instance_count = var.cloud_run_max_instances
    }

    containers {
      image = var.cloud_run_image

      # Resource limits
      resources {
        limits = {
          cpu    = var.cloud_run_cpu
          memory = var.cloud_run_memory
        }

        cpu_idle          = true
        startup_cpu_boost = true
      }

      # Environment variables
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "REGION"
        value = var.region
      }

      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.ml_pipeline_bucket.name
      }

      env {
        name  = "MODEL_NAME"
        value = var.vertex_ai_model_name
      }

      env {
        name  = "VERTEX_AI_ENDPOINT"
        value = google_vertex_ai_endpoint.model_endpoint.name
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      # Secret environment variables
      env {
        name = "GOOGLE_APPLICATION_CREDENTIALS"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.ml_pipeline_sa_key.secret_id
            version = "latest"
          }
        }
      }

      # Health check port
      ports {
        container_port = 8080
      }

      # Startup and liveness probes
      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 30
        timeout_seconds       = 10
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 30
        timeout_seconds       = 10
        period_seconds        = 30
        failure_threshold     = 3
      }
    }

    # VPC access (if needed)
    vpc_access {
      egress = "ALL_TRAFFIC"
    }

    # Timeout configuration
    timeout = "300s"

    # Labels
    labels = {
      environment = var.environment
      project     = var.app_name
      service     = "ml-pipeline-api"
    }

    # Annotations
    annotations = {
      "autoscaling.knative.dev/minScale"         = "0"
      "autoscaling.knative.dev/maxScale"         = tostring(var.cloud_run_max_instances)
      "run.googleapis.com/execution-environment" = "gen2"
    }
  }

  depends_on = [
    google_project_service.ml_pipeline_apis,
    google_service_account.ml_api_sa,
    google_storage_bucket.ml_pipeline_bucket,
    google_vertex_ai_endpoint.model_endpoint
  ]
}

# IAM policy for Cloud Run service
resource "google_cloud_run_v2_service_iam_policy" "ml_pipeline_api_policy" {
  count = var.allow_public_access ? 1 : 0

  location = google_cloud_run_v2_service.ml_pipeline_api.location
  name     = google_cloud_run_v2_service.ml_pipeline_api.name

  policy_data = data.google_iam_policy.noauth[0].policy_data
}

# IAM policy data for public access
data "google_iam_policy" "noauth" {
  count = var.allow_public_access ? 1 : 0

  binding {
    role    = "roles/run.invoker"
    members = ["allUsers"]
  }
}

# Alternative: IAM binding for authenticated access only
resource "google_cloud_run_v2_service_iam_member" "ml_pipeline_api_invoker" {
  count = var.allow_public_access ? 0 : 1

  location = google_cloud_run_v2_service.ml_pipeline_api.location
  name     = google_cloud_run_v2_service.ml_pipeline_api.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.ml_api_sa.email}"
}

# Cloud Scheduler job for periodic pipeline execution (optional)
resource "google_cloud_scheduler_job" "ml_pipeline_schedule" {
  name     = "${var.app_name}-ml-pipeline-schedule"
  region   = var.region
  schedule = "0 2 * * *" # Daily at 2 AM

  description = "Scheduled ML pipeline execution"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.ml_pipeline_api.uri}/trigger"

    headers = {
      "Content-Type" = "application/json"
    }

    body = base64encode(jsonencode({
      "pipeline_type" = "complete"
      "scheduled"     = true
    }))

    oidc_token {
      service_account_email = google_service_account.ml_api_sa.email
    }
  }

  depends_on = [
    google_project_service.ml_pipeline_apis,
    google_cloud_run_v2_service.ml_pipeline_api,
    google_service_account.ml_api_sa
  ]
}