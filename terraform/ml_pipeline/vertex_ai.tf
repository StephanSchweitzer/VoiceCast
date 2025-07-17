# Vertex AI Training Resources

# Vertex AI Model Registry
resource "google_vertex_ai_model" "emotion_model" {
  name         = var.vertex_ai_model_name
  display_name = "${var.app_name} Emotion Recognition Model"
  description  = "Emotion recognition model for VoiceCast application"

  # Model versioning
  version_aliases = ["latest"]

  # Labels
  labels = {
    model_type  = "emotion-recognition"
    framework   = "tensorflow"
    environment = var.environment
    project     = var.app_name
  }

  region = var.region

  depends_on = [
    google_project_service.ml_pipeline_apis,
    google_service_account.ml_pipeline_sa
  ]
}

# Custom Training Job Template (for GPU-enabled training)
resource "google_vertex_ai_custom_job" "training_job_template" {
  display_name = "${var.app_name}-training-job-template"

  job_spec {
    worker_pool_specs {
      machine_spec {
        machine_type = var.training_instance_type

        # GPU configuration
        accelerator_type  = var.gpu_type
        accelerator_count = var.gpu_count
      }

      replica_count = 1

      # Container specification
      container_spec {
        image_uri = "gcr.io/deeplearning-platform-release/tf2-gpu.2-11:latest"

        # Environment variables for training
        env {
          name  = "GCS_BUCKET"
          value = google_storage_bucket.ml_pipeline_bucket.name
        }

        env {
          name  = "MODEL_NAME"
          value = var.vertex_ai_model_name
        }

        env {
          name  = "PROJECT_ID"
          value = var.project_id
        }

        env {
          name  = "REGION"
          value = var.region
        }

        # Command to run training
        command = [
          "python",
          "-m",
          "trainer.task"
        ]
      }

      # Use preemptible instances for cost optimization
      disk_spec {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 100
      }
    }

    # Service account for training job
    service_account = google_service_account.ml_pipeline_sa.email

    # Network configuration
    network = "projects/${var.project_id}/global/networks/default"
  }

  region = var.region

  depends_on = [
    google_project_service.ml_pipeline_apis,
    google_service_account.ml_pipeline_sa
  ]
}

# Vertex AI Endpoint for model serving
resource "google_vertex_ai_endpoint" "model_endpoint" {
  name         = "${var.app_name}-model-endpoint"
  display_name = "${var.app_name} Model Endpoint"
  description  = "Endpoint for serving the emotion recognition model"

  labels = {
    model_type  = "emotion-recognition"
    environment = var.environment
    project     = var.app_name
  }

  region = var.region

  depends_on = [
    google_project_service.ml_pipeline_apis,
    google_vertex_ai_model.emotion_model
  ]
}

# Vertex AI Notebook Instance for development and experimentation
resource "google_notebooks_instance" "ml_notebook" {
  name     = "${var.app_name}-ml-notebook"
  location = var.zone

  machine_type = var.training_instance_type

  # VM image
  vm_image {
    project      = "deeplearning-platform-release"
    image_family = "tf2-latest-gpu"
  }

  # GPU configuration
  accelerator_config {
    type       = var.gpu_type
    core_count = var.gpu_count
  }

  # Use preemptible instance for cost optimization
  instance_owners = [google_service_account.ml_pipeline_sa.email]

  service_account = google_service_account.ml_pipeline_sa.email

  # Boot disk
  boot_disk_type    = "PD_STANDARD"
  boot_disk_size_gb = 100

  # Data disk
  data_disk_type    = "PD_STANDARD"
  data_disk_size_gb = 100

  # Network
  network = "projects/${var.project_id}/global/networks/default"
  subnet  = "projects/${var.project_id}/regions/${var.region}/subnetworks/default"

  # Labels
  labels = {
    environment = var.environment
    project     = var.app_name
    purpose     = "ml-development"
  }

  depends_on = [
    google_project_service.ml_pipeline_apis,
    google_service_account.ml_pipeline_sa
  ]
}