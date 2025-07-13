output "app_url" {
  description = "URL of the deployed VoiceCast application"
  value       = google_cloud_run_v2_service.voicecast_app.uri
}

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.voicecast_db.connection_name
}

output "database_private_ip" {
  description = "Cloud SQL private IP address"
  value       = google_sql_database_instance.voicecast_db.private_ip_address
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}"
}

output "reference_audio_bucket" {
  description = "Reference audio samples bucket"
  value       = google_storage_bucket.reference_audios.name
}

output "generated_audio_bucket" {
  description = "Generated audio outputs bucket"
  value       = google_storage_bucket.generated_audios.name
}

output "training_datasets_bucket" {
  description = "Training datasets bucket"
  value       = google_storage_bucket.training_datasets.name
}

output "cloud_run_service_account" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloud_run_sa.email
}