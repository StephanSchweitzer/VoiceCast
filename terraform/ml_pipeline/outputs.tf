# Outputs for ML pipeline infrastructure

# Storage bucket outputs
output "ml_raw_data_bucket_name" {
  description = "Name of the raw data bucket"
  value       = google_storage_bucket.ml_raw_data.name
}

output "ml_raw_data_bucket_url" {
  description = "URL of the raw data bucket"
  value       = google_storage_bucket.ml_raw_data.url
}

output "ml_processed_data_bucket_name" {
  description = "Name of the processed data bucket"
  value       = google_storage_bucket.ml_processed_data.name
}

output "ml_processed_data_bucket_url" {
  description = "URL of the processed data bucket"
  value       = google_storage_bucket.ml_processed_data.url
}

output "ml_models_bucket_name" {
  description = "Name of the models bucket"
  value       = google_storage_bucket.ml_models.name
}

output "ml_models_bucket_url" {
  description = "URL of the models bucket"
  value       = google_storage_bucket.ml_models.url
}

output "ml_temp_bucket_name" {
  description = "Name of the temporary bucket"
  value       = google_storage_bucket.ml_temp.name
}

output "ml_functions_source_bucket_name" {
  description = "Name of the functions source bucket"
  value       = google_storage_bucket.ml_functions_source.name
}

# Service account outputs
output "ml_pipeline_service_account_email" {
  description = "Email of the ML pipeline service account"
  value       = google_service_account.ml_pipeline_sa.email
}

output "ml_pipeline_service_account_key" {
  description = "Private key of the ML pipeline service account"
  value       = google_service_account_key.ml_pipeline_key.private_key
  sensitive   = true
}

output "ml_training_service_account_email" {
  description = "Email of the ML training service account"
  value       = google_service_account.ml_training_sa.email
}

# Cloud Functions outputs
output "trigger_data_pipeline_function_url" {
  description = "URL of the trigger data pipeline function"
  value       = google_cloudfunctions2_function.trigger_data_pipeline.service_config[0].uri
}

output "trigger_training_pipeline_function_url" {
  description = "URL of the trigger training pipeline function"
  value       = google_cloudfunctions2_function.trigger_training_pipeline.service_config[0].uri
}

output "trigger_complete_pipeline_function_url" {
  description = "URL of the trigger complete pipeline function"
  value       = google_cloudfunctions2_function.trigger_complete_pipeline.service_config[0].uri
}

output "pipeline_status_function_url" {
  description = "URL of the pipeline status function"
  value       = google_cloudfunctions2_function.pipeline_status.service_config[0].uri
}

output "list_models_function_url" {
  description = "URL of the list models function"
  value       = google_cloudfunctions2_function.list_models.service_config[0].uri
}

# Vertex AI outputs
output "vertex_ai_region" {
  description = "Vertex AI region"
  value       = var.vertex_ai_region
}

output "vertex_ai_dataset_name" {
  description = "Name of the Vertex AI dataset"
  value       = google_vertex_ai_dataset.ml_audio_dataset.name
}

output "vertex_ai_tensorboard_name" {
  description = "Name of the Vertex AI tensorboard"
  value       = var.enable_monitoring ? google_vertex_ai_tensorboard.ml_pipeline_tensorboard[0].name : null
}

output "vertex_ai_endpoint_name" {
  description = "Name of the Vertex AI endpoint"
  value       = var.api_gateway_enabled ? google_vertex_ai_endpoint.ml_model_endpoint[0].name : null
}

output "vertex_ai_featurestore_name" {
  description = "Name of the Vertex AI featurestore"
  value       = var.enable_monitoring ? google_vertex_ai_featurestore.ml_featurestore[0].name : null
}

# Compute outputs
output "training_instance_template_name" {
  description = "Name of the training instance template"
  value       = google_compute_instance_template.ml_training_template.name
}

output "data_processing_instance_template_name" {
  description = "Name of the data processing instance template"
  value       = google_compute_instance_template.ml_data_processing_template.name
}

output "training_instance_group_name" {
  description = "Name of the training instance group"
  value       = var.enable_auto_scaling ? google_compute_region_instance_group_manager.ml_training_group[0].name : null
}

output "training_autoscaler_name" {
  description = "Name of the training autoscaler"
  value       = var.enable_auto_scaling ? google_compute_region_autoscaler.ml_training_autoscaler[0].name : null
}

# Pub/Sub outputs
output "ml_pipeline_events_topic_name" {
  description = "Name of the ML pipeline events topic"
  value       = var.enable_pub_sub ? google_pubsub_topic.ml_pipeline_events[0].name : null
}

output "ml_pipeline_events_subscription_name" {
  description = "Name of the ML pipeline events subscription"
  value       = var.enable_pub_sub ? google_pubsub_subscription.ml_pipeline_events_subscription[0].name : null
}

output "ml_pipeline_dead_letter_topic_name" {
  description = "Name of the ML pipeline dead letter topic"
  value       = var.enable_pub_sub ? google_pubsub_topic.ml_pipeline_dead_letter[0].name : null
}

# Secret Manager outputs
output "ml_pipeline_service_account_key_secret_name" {
  description = "Name of the service account key secret"
  value       = var.enable_secret_manager ? google_secret_manager_secret.ml_pipeline_service_account_key[0].secret_id : null
}

# API endpoints for easy access
output "ml_pipeline_api_endpoints" {
  description = "ML Pipeline API endpoints"
  value = {
    trigger_data_pipeline    = google_cloudfunctions2_function.trigger_data_pipeline.service_config[0].uri
    trigger_training         = google_cloudfunctions2_function.trigger_training_pipeline.service_config[0].uri
    trigger_complete         = google_cloudfunctions2_function.trigger_complete_pipeline.service_config[0].uri
    pipeline_status          = google_cloudfunctions2_function.pipeline_status.service_config[0].uri
    list_models              = google_cloudfunctions2_function.list_models.service_config[0].uri
  }
}

# Configuration summary
output "ml_pipeline_configuration" {
  description = "ML Pipeline configuration summary"
  value = {
    project_id                = var.project_id
    region                    = var.region
    vertex_ai_region          = var.vertex_ai_region
    gpu_enabled               = var.enable_gpu_training
    gpu_type                  = var.gpu_type
    gpu_count                 = var.gpu_count
    preemptible_instances     = var.use_preemptible_instances
    auto_scaling_enabled      = var.enable_auto_scaling
    max_training_instances    = var.max_training_instances
    monitoring_enabled        = var.enable_monitoring
    notifications_enabled     = var.enable_notifications
    pub_sub_enabled           = var.enable_pub_sub
    secret_manager_enabled    = var.enable_secret_manager
    cost_optimization_enabled = var.enable_cost_optimization
    data_retention_days       = var.data_retention_days
    model_retention_days      = var.model_retention_days
  }
}

# Bucket information for easy reference
output "ml_pipeline_buckets" {
  description = "ML Pipeline storage buckets"
  value = {
    raw_data = {
      name = google_storage_bucket.ml_raw_data.name
      url  = google_storage_bucket.ml_raw_data.url
    }
    processed_data = {
      name = google_storage_bucket.ml_processed_data.name
      url  = google_storage_bucket.ml_processed_data.url
    }
    models = {
      name = google_storage_bucket.ml_models.name
      url  = google_storage_bucket.ml_models.url
    }
    temp = {
      name = google_storage_bucket.ml_temp.name
      url  = google_storage_bucket.ml_temp.url
    }
    functions_source = {
      name = google_storage_bucket.ml_functions_source.name
      url  = google_storage_bucket.ml_functions_source.url
    }
  }
}

# Cost optimization information
output "ml_pipeline_cost_optimization" {
  description = "ML Pipeline cost optimization features"
  value = {
    preemptible_instances = var.use_preemptible_instances
    auto_scaling         = var.enable_auto_scaling
    lifecycle_management = var.enable_lifecycle_management
    storage_classes_used = var.enable_cost_optimization
    data_retention_days  = var.data_retention_days
    model_retention_days = var.model_retention_days
    estimated_monthly_cost = {
      description = "Estimated monthly cost with cost optimization"
      storage_gb_month = "~100-500 GB"
      compute_hours    = "~10-50 hours preemptible"
      vertex_ai_usage  = "Pay-per-use"
      functions_calls  = "~1000-10000 calls"
    }
  }
}

# Monitoring and alerting information
output "ml_pipeline_monitoring" {
  description = "ML Pipeline monitoring setup"
  value = var.enable_monitoring ? {
    tensorboard_enabled = true
    custom_metrics      = true
    log_aggregation     = true
    alerting_enabled    = var.enable_notifications
    health_checks       = var.enable_auto_scaling
  } : {
    tensorboard_enabled = false
    custom_metrics      = false
    log_aggregation     = false
    alerting_enabled    = false
    health_checks       = false
  }
}

# Environment setup commands
output "setup_commands" {
  description = "Commands to set up the ML pipeline environment"
  value = [
    "# Set environment variables:",
    "export GCP_PROJECT_ID=${var.project_id}",
    "export GCP_REGION=${var.region}",
    "export ML_RAW_DATA_BUCKET=${google_storage_bucket.ml_raw_data.name}",
    "export ML_PROCESSED_DATA_BUCKET=${google_storage_bucket.ml_processed_data.name}",
    "export ML_MODELS_BUCKET=${google_storage_bucket.ml_models.name}",
    "",
    "# Test API endpoints:",
    "curl -X POST ${google_cloudfunctions2_function.pipeline_status.service_config[0].uri}",
    "curl -X GET ${google_cloudfunctions2_function.list_models.service_config[0].uri}",
    "",
    "# Upload sample data:",
    "gsutil cp your_audio_files/* gs://${google_storage_bucket.ml_raw_data.name}/",
    "",
    "# Trigger data pipeline:",
    "curl -X POST ${google_cloudfunctions2_function.trigger_data_pipeline.service_config[0].uri}"
  ]
}