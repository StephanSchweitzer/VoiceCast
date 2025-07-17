# ML Pipeline Outputs

# GCS Bucket outputs
output "ml_pipeline_bucket_name" {
  description = "Name of the ML pipeline GCS bucket for processed data and models"
  value       = google_storage_bucket.ml_pipeline_bucket.name
}

output "ml_pipeline_bucket_url" {
  description = "URL of the ML pipeline GCS bucket"
  value       = google_storage_bucket.ml_pipeline_bucket.url
}

# Cloud Run API outputs
output "ml_pipeline_api_url" {
  description = "URL of the ML pipeline Cloud Run API for manual triggering"
  value       = google_cloud_run_v2_service.ml_pipeline_api.uri
}

output "ml_pipeline_api_name" {
  description = "Name of the ML pipeline Cloud Run service"
  value       = google_cloud_run_v2_service.ml_pipeline_api.name
}

# Vertex AI outputs
output "vertex_ai_model_name" {
  description = "Name of the Vertex AI emotion recognition model"
  value       = google_vertex_ai_model.emotion_model.name
}

output "vertex_ai_model_display_name" {
  description = "Display name of the Vertex AI emotion recognition model"
  value       = google_vertex_ai_model.emotion_model.display_name
}

output "vertex_ai_endpoint_name" {
  description = "Name of the Vertex AI model endpoint"
  value       = google_vertex_ai_endpoint.model_endpoint.name
}

output "vertex_ai_endpoint_display_name" {
  description = "Display name of the Vertex AI model endpoint"
  value       = google_vertex_ai_endpoint.model_endpoint.display_name
}

# Training infrastructure outputs
output "training_job_template_name" {
  description = "Name of the Vertex AI training job template"
  value       = google_vertex_ai_custom_job.training_job_template.display_name
}

output "ml_notebook_instance_name" {
  description = "Name of the ML development notebook instance"
  value       = google_notebooks_instance.ml_notebook.name
}

output "ml_notebook_proxy_uri" {
  description = "Proxy URI for accessing the ML notebook instance"
  value       = google_notebooks_instance.ml_notebook.proxy_uri
}

# Service account outputs
output "ml_pipeline_service_account_email" {
  description = "Email of the ML pipeline service account"
  value       = google_service_account.ml_pipeline_sa.email
}

output "ml_api_service_account_email" {
  description = "Email of the ML API service account"
  value       = google_service_account.ml_api_sa.email
}

# Secret manager outputs
output "ml_pipeline_sa_key_secret_name" {
  description = "Name of the secret containing ML pipeline service account key"
  value       = google_secret_manager_secret.ml_pipeline_sa_key.secret_id
}

# Configuration outputs for environment setup
output "environment_config" {
  description = "Environment configuration for ML pipeline"
  value = {
    project_id    = var.project_id
    region        = var.region
    bucket_name   = google_storage_bucket.ml_pipeline_bucket.name
    model_name    = var.vertex_ai_model_name
    api_url       = google_cloud_run_v2_service.ml_pipeline_api.uri
    endpoint_name = google_vertex_ai_endpoint.model_endpoint.name
    notebook_uri  = google_notebooks_instance.ml_notebook.proxy_uri
  }
  sensitive = false
}

# Scheduled job output
output "ml_pipeline_schedule_name" {
  description = "Name of the scheduled ML pipeline job"
  value       = google_cloud_scheduler_job.ml_pipeline_schedule.name
}