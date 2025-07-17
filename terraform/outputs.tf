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

# ML Pipeline Outputs (conditional)
output "ml_pipeline_bucket_name" {
  description = "Name of the ML pipeline GCS bucket"
  value       = var.ml_pipeline_enabled ? module.ml_pipeline[0].ml_pipeline_bucket_name : null
}

output "ml_pipeline_api_url" {
  description = "URL of the ML pipeline API"
  value       = var.ml_pipeline_enabled ? module.ml_pipeline[0].ml_pipeline_api_url : null
}

output "vertex_ai_model_name" {
  description = "Name of the Vertex AI model"
  value       = var.ml_pipeline_enabled ? module.ml_pipeline[0].vertex_ai_model_name : null
}

output "vertex_ai_endpoint_name" {
  description = "Name of the Vertex AI endpoint"
  value       = var.ml_pipeline_enabled ? module.ml_pipeline[0].vertex_ai_endpoint_name : null
}

output "ml_notebook_proxy_uri" {
  description = "URI for accessing the ML notebook"
  value       = var.ml_pipeline_enabled ? module.ml_pipeline[0].ml_notebook_proxy_uri : null
}

output "ml_pipeline_service_account_email" {
  description = "Email of the ML pipeline service account"
  value       = var.ml_pipeline_enabled ? module.ml_pipeline[0].ml_pipeline_service_account_email : null
}