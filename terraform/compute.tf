resource "google_artifact_registry_repository" "voicecast_repo" {
  location      = var.region
  repository_id = var.app_name
  description   = "Docker repository for VoiceCast application"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

resource "google_compute_network" "voicecast_vpc" {
  name                    = "${var.app_name}-network"
  auto_create_subnetworks = true
  depends_on              = [google_project_service.apis]
}

resource "google_vpc_access_connector" "voicecast_connector" {
  name          = "${var.app_name}-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.voicecast_vpc.name

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_v2_service" "voicecast_app" {
  name     = "${var.app_name}-app"
  location = var.region

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    vpc_access {
      connector = google_vpc_access_connector.voicecast_connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    service_account = google_service_account.cloud_run_sa.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}/${var.app_name}-app:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
        cpu_idle = true
      }

      env {
        name  = "DATABASE_URL"
        value = "postgresql://${google_sql_user.voicecast_user.name}@/${google_sql_database.voicecast_database.name}?host=/cloudsql/${google_sql_database_instance.voicecast_db.connection_name}"
      }

      env {
        name = "DATABASE_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.nextauth_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "NEXTAUTH_URL"
        value = google_cloud_run_v2_service.voicecast_app.uri
      }

      env {
        name  = "REFERENCE_AUDIO_BUCKET"
        value = google_storage_bucket.reference_audios.name
      }

      env {
        name  = "GENERATED_AUDIO_BUCKET"
        value = google_storage_bucket.generated_audios.name
      }

      env {
        name  = "TRAINING_DATASETS_BUCKET"
        value = google_storage_bucket.training_datasets.name
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "NEXT_TELEMETRY_DISABLED"
        value = "1"
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_sql_database_instance.voicecast_db,
    google_vpc_access_connector.voicecast_connector
  ]
}