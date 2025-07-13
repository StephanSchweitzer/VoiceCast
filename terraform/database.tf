resource "google_sql_database_instance" "voicecast_db" {
  name             = "${var.app_name}-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-g1-small"

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      location                       = var.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
    }

    ip_configuration {
      ipv4_enabled = true
      # If we have time for private networking:
      # ipv4_enabled    = false
      # private_network = google_compute_network.voicecast_vpc.id
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }
  }

  deletion_protection = false

  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "voicecast_database" {
  name     = var.app_name
  instance = google_sql_database_instance.voicecast_db.name
}

resource "google_sql_user" "voicecast_user" {
  name     = var.app_name
  instance = google_sql_database_instance.voicecast_db.name
  password = var.db_password
}