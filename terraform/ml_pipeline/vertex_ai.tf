# Vertex AI resources for ML pipeline

# Create Vertex AI custom training pipeline
resource "google_vertex_ai_tensorboard" "ml_pipeline_tensorboard" {
  count = var.enable_monitoring ? 1 : 0

  display_name = "${var.app_name}-ml-pipeline-tensorboard"
  description  = "Tensorboard for ML pipeline monitoring"
  region       = var.vertex_ai_region

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# Create Vertex AI endpoint for model serving (optional)
resource "google_vertex_ai_endpoint" "ml_model_endpoint" {
  count = var.api_gateway_enabled ? 1 : 0

  name         = "${var.app_name}-ml-model-endpoint"
  display_name = "${var.app_name} ML Model Endpoint"
  description  = "Endpoint for serving ML models"
  location     = var.vertex_ai_region

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# Create Vertex AI featurestore for feature management (optional)
resource "google_vertex_ai_featurestore" "ml_featurestore" {
  count = var.enable_monitoring ? 1 : 0

  name   = "${var.app_name}-ml-featurestore"
  region = var.vertex_ai_region

  labels = var.labels

  online_serving_config {
    fixed_node_count = 1
  }

  depends_on = [google_project_service.ml_apis]
}

# Create a dataset for Vertex AI (placeholder)
resource "google_vertex_ai_dataset" "ml_audio_dataset" {
  display_name   = "${var.app_name}-audio-dataset"
  metadata_schema_uri = "gs://google-cloud-aiplatform/schema/dataset/metadata/audio_1.0.0.yaml"
  region         = var.vertex_ai_region

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# Create training job template for custom training
resource "google_vertex_ai_training_pipeline" "ml_training_template" {
  count = var.enable_gpu_training ? 1 : 0

  display_name = "${var.app_name}-ml-training-template"
  location     = var.vertex_ai_region

  training_task_definition = jsonencode({
    "trainingTaskMetadata" : {
      "baseOutputDirectory" : {
        "outputUriPrefix" : "gs://${google_storage_bucket.ml_models.name}/training_outputs"
      }
    }
  })

  training_task_inputs = jsonencode({
    "workerPoolSpecs" : [
      {
        "machineSpec" : {
          "machineType" : var.training_machine_type
          "acceleratorType" : upper(replace(var.gpu_type, "-", "_"))
          "acceleratorCount" : var.gpu_count
        }
        "replicaCount" : 1
        "diskSpec" : {
          "bootDiskType" : var.training_disk_type
          "bootDiskSizeGb" : var.training_disk_size
        }
        "containerSpec" : {
          "imageUri" : "gcr.io/cloud-aiplatform/training/pytorch-gpu.1-12:latest"
          "command" : [
            "python",
            "/app/train.py"
          ]
          "args" : [
            "--model-dir",
            "gs://${google_storage_bucket.ml_models.name}/models"
          ]
        }
      }
    ]
    "scheduling" : {
      "restartJobOnWorkerRestart" : true
    }
  })

  # Use preemptible instances for cost optimization
  training_task_inputs = var.use_preemptible_instances ? jsonencode({
    "workerPoolSpecs" : [
      {
        "machineSpec" : {
          "machineType" : var.training_machine_type
          "acceleratorType" : upper(replace(var.gpu_type, "-", "_"))
          "acceleratorCount" : var.gpu_count
        }
        "replicaCount" : 1
        "diskSpec" : {
          "bootDiskType" : var.training_disk_type
          "bootDiskSizeGb" : var.training_disk_size
        }
        "containerSpec" : {
          "imageUri" : "gcr.io/cloud-aiplatform/training/pytorch-gpu.1-12:latest"
          "command" : [
            "python",
            "/app/train.py"
          ]
          "args" : [
            "--model-dir",
            "gs://${google_storage_bucket.ml_models.name}/models"
          ]
        }
      }
    ]
    "scheduling" : {
      "restartJobOnWorkerRestart" : true
    }
    "serviceAccount" : google_service_account.ml_pipeline_sa.email
  }) : training_task_inputs

  model_to_upload {
    display_name = "${var.app_name}-ml-model"
    description  = "ML model trained via Vertex AI pipeline"
    
    container_spec {
      image_uri = "gcr.io/cloud-aiplatform/prediction/pytorch-gpu.1-12:latest"
      ports {
        container_port = 8080
      }
    }
    
    artifact_uri = "gs://${google_storage_bucket.ml_models.name}/models"
  }

  input_data_config {
    dataset_id = google_vertex_ai_dataset.ml_audio_dataset.name
    
    # Optional: Add data filtering
    filter_split {
      training_filter   = "labels.ml_use=\"train\""
      validation_filter = "labels.ml_use=\"validation\""
      test_filter       = "labels.ml_use=\"test\""
    }
  }

  labels = var.labels

  depends_on = [
    google_project_service.ml_apis,
    google_service_account.ml_pipeline_sa,
    google_vertex_ai_dataset.ml_audio_dataset
  ]
}

# Create model registry for storing trained models
resource "google_vertex_ai_model" "ml_model_registry" {
  count = var.enable_monitoring ? 1 : 0

  display_name = "${var.app_name}-ml-model-registry"
  description  = "Model registry for ML pipeline models"
  location     = var.vertex_ai_region

  container_spec {
    image_uri = "gcr.io/cloud-aiplatform/prediction/pytorch-gpu.1-12:latest"
    ports {
      container_port = 8080
    }
    env {
      name  = "MODEL_NAME"
      value = "${var.app_name}-ml-model"
    }
    env {
      name  = "MODEL_DIR"
      value = "gs://${google_storage_bucket.ml_models.name}/models"
    }
  }

  artifact_uri = "gs://${google_storage_bucket.ml_models.name}/models"

  # Add model metadata
  metadata_schema_uri = "gs://google-cloud-aiplatform/schema/model/metadata/audio_classification_1.0.0.yaml"

  labels = var.labels

  depends_on = [google_project_service.ml_apis]
}

# Create hyperparameter tuning job template
resource "google_vertex_ai_hyperparameter_tuning_job" "ml_hyperparameter_tuning" {
  count = var.enable_gpu_training ? 1 : 0

  display_name = "${var.app_name}-ml-hyperparameter-tuning"
  location     = var.vertex_ai_region

  study_spec {
    metrics {
      metric_id = "accuracy"
      goal      = "MAXIMIZE"
    }
    
    parameters {
      parameter_id = "learning_rate"
      double_value_spec {
        min_value = 0.0001
        max_value = 0.1
      }
      scale_type = "UNIT_LOG_SCALE"
    }
    
    parameters {
      parameter_id = "batch_size"
      discrete_value_spec {
        values = [16, 32, 64, 128]
      }
    }
    
    parameters {
      parameter_id = "epochs"
      integer_value_spec {
        min_value = 10
        max_value = 100
      }
    }
    
    algorithm = "RANDOM_SEARCH"
  }

  max_trial_count      = 10
  parallel_trial_count = 2

  trial_job_spec {
    worker_pool_specs {
      machine_spec {
        machine_type     = var.training_machine_type
        accelerator_type = upper(replace(var.gpu_type, "-", "_"))
        accelerator_count = var.gpu_count
      }
      
      replica_count = 1
      
      container_spec {
        image_uri = "gcr.io/cloud-aiplatform/training/pytorch-gpu.1-12:latest"
        command   = ["python", "/app/train.py"]
        args = [
          "--model-dir",
          "gs://${google_storage_bucket.ml_models.name}/models",
          "--learning-rate",
          "{{.learning_rate}}",
          "--batch-size",
          "{{.batch_size}}",
          "--epochs",
          "{{.epochs}}"
        ]
      }
    }
    
    base_output_directory {
      output_uri_prefix = "gs://${google_storage_bucket.ml_models.name}/hyperparameter_tuning"
    }
    
    service_account = google_service_account.ml_pipeline_sa.email
  }

  labels = var.labels

  depends_on = [
    google_project_service.ml_apis,
    google_service_account.ml_pipeline_sa
  ]
}

# Create batch prediction job template
resource "google_vertex_ai_batch_prediction_job" "ml_batch_prediction" {
  count = var.enable_monitoring ? 1 : 0

  display_name = "${var.app_name}-ml-batch-prediction"
  location     = var.vertex_ai_region

  model = google_vertex_ai_model.ml_model_registry[0].id

  input_config {
    instances_format = "jsonl"
    gcs_source {
      uris = ["gs://${google_storage_bucket.ml_processed_data.name}/batch_prediction_input/*"]
    }
  }

  output_config {
    predictions_format = "jsonl"
    gcs_destination {
      output_uri_prefix = "gs://${google_storage_bucket.ml_models.name}/batch_predictions"
    }
  }

  dedicated_resources {
    machine_spec {
      machine_type = "n1-standard-4"
    }
    starting_replica_count = 1
    max_replica_count      = var.max_training_instances
  }

  labels = var.labels

  depends_on = [
    google_project_service.ml_apis,
    google_vertex_ai_model.ml_model_registry
  ]
}

# Create Vertex AI pipeline for orchestration
resource "google_vertex_ai_pipeline_job" "ml_pipeline_orchestration" {
  count = var.enable_monitoring ? 1 : 0

  display_name = "${var.app_name}-ml-pipeline-orchestration"
  location     = var.vertex_ai_region

  template_uri = "gs://${google_storage_bucket.ml_functions_source.name}/pipeline_template.json"

  parameter_values = jsonencode({
    "project_id" : var.project_id
    "region" : var.region
    "raw_data_bucket" : google_storage_bucket.ml_raw_data.name
    "processed_data_bucket" : google_storage_bucket.ml_processed_data.name
    "models_bucket" : google_storage_bucket.ml_models.name
    "service_account" : google_service_account.ml_pipeline_sa.email
  })

  labels = var.labels

  depends_on = [
    google_project_service.ml_apis,
    google_service_account.ml_pipeline_sa,
    google_storage_bucket.ml_functions_source
  ]
}

# IAM bindings for Vertex AI
resource "google_project_iam_member" "vertex_ai_permissions" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/aiplatform.admin"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}