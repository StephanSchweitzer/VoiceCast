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
  ip_cidr_range = "10.9.0.0/28"  # Changed from 10.8.0.0/28 to avoid conflict
  network       = google_compute_network.voicecast_vpc.name
  min_instances = 2
  max_instances = 10

  depends_on = [google_project_service.apis]
}

# NextJS App Service
resource "google_cloud_run_v2_service" "voicecast_app" {
  name     = "${var.app_name}-app"
  location = var.region

  template {
    scaling {
      min_instance_count = 1
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

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
        cpu_idle = true
      }

      startup_probe {
        http_get {
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 20
        timeout_seconds = 10
        period_seconds = 5
        failure_threshold = 10
      }

      env {
        name  = "DATABASE_URL"
        value = "postgresql://${google_sql_user.voicecast_user.name}:${var.db_password}@localhost/${google_sql_database.voicecast_database.name}?host=/cloudsql/${google_sql_database_instance.voicecast_db.connection_name}"
      }

      env {
        name  = "DIRECT_URL"
        value = "postgresql://${google_sql_user.voicecast_user.name}:${var.db_password}@localhost/${google_sql_database.voicecast_database.name}?host=/cloudsql/${google_sql_database_instance.voicecast_db.connection_name}"
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
        value = "https://projetannuel.com"
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

      env {
        name  = "TTS_API_URL"
        value = google_cloud_run_v2_service.voicecast_tts.uri
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.voicecast_db.connection_name]
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_sql_database_instance.voicecast_db,
    google_vpc_access_connector.voicecast_connector,
    google_cloud_run_v2_service.voicecast_tts  # Ensure TTS service exists first
  ]

  deletion_protection = false
}

#TTS app service
resource "google_cloud_run_v2_service" "voicecast_tts" {
  name     = "${var.app_name}-tts"
  location = var.region

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 3
    }

    vpc_access {
      connector = google_vpc_access_connector.voicecast_connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    service_account = google_service_account.cloud_run_sa.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}/${var.app_name}-tts:latest"

      ports {
        container_port = 8000
      }

      resources {
        limits = {
          cpu    = "4"
          memory = "8Gi"
        }
        cpu_idle = false
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8000
        }
        initial_delay_seconds = 60
        timeout_seconds = 5
        period_seconds = 10
        failure_threshold = 30
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "ENVIRONMENT"
        value = "production"
      }

    }
  }

  depends_on = [
    google_project_service.apis,
    google_vpc_access_connector.voicecast_connector
  ]

  deletion_protection = false
}

resource "google_cloud_run_domain_mapping" "domain" {
  location = var.region
  name     = "projetannuel.com"

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.voicecast_app.name
  }

  depends_on = [google_cloud_run_v2_service.voicecast_app]
}