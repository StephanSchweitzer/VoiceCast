# IAM resources for ML pipeline

# Service account for ML pipeline operations
resource "google_service_account" "ml_pipeline_sa" {
  account_id   = "${var.app_name}-ml-pipeline"
  display_name = "ML Pipeline Service Account"
  description  = "Service account for ML pipeline operations including data processing, training, and model deployment"

  depends_on = [google_project_service.ml_apis]
}

# Create service account key
resource "google_service_account_key" "ml_pipeline_key" {
  service_account_id = google_service_account.ml_pipeline_sa.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Store service account key in Secret Manager
resource "google_secret_manager_secret" "ml_pipeline_service_account_key" {
  count = var.enable_secret_manager ? 1 : 0
  
  secret_id = "${var.app_name}-ml-pipeline-service-account-key"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.ml_apis]
}

resource "google_secret_manager_secret_version" "ml_pipeline_service_account_key_version" {
  count = var.enable_secret_manager ? 1 : 0
  
  secret      = google_secret_manager_secret.ml_pipeline_service_account_key[0].id
  secret_data = base64decode(google_service_account_key.ml_pipeline_key.private_key)
}

# Core ML Pipeline permissions
resource "google_project_iam_member" "ml_pipeline_core_permissions" {
  for_each = toset([
    "roles/storage.admin",
    "roles/aiplatform.admin",
    "roles/ml.admin",
    "roles/compute.admin",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
    "roles/secretmanager.accessor",
    "roles/secretmanager.secretAccessor"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Cloud Functions permissions
resource "google_project_iam_member" "ml_pipeline_functions_permissions" {
  for_each = toset([
    "roles/cloudfunctions.admin",
    "roles/cloudfunctions.invoker",
    "roles/run.invoker",
    "roles/eventarc.admin",
    "roles/pubsub.admin",
    "roles/pubsub.publisher",
    "roles/pubsub.subscriber"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Vertex AI specific permissions
resource "google_project_iam_member" "ml_pipeline_vertex_permissions" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/aiplatform.admin",
    "roles/aiplatform.customCodeServiceAgent",
    "roles/aiplatform.serviceAgent"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Compute Engine permissions for training instances
resource "google_project_iam_member" "ml_pipeline_compute_permissions" {
  for_each = toset([
    "roles/compute.instanceAdmin.v1",
    "roles/compute.instanceAdmin",
    "roles/compute.admin",
    "roles/compute.serviceAgent",
    "roles/iam.serviceAccountUser"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Cloud Build permissions (for building custom containers)
resource "google_project_iam_member" "ml_pipeline_build_permissions" {
  for_each = toset([
    "roles/cloudbuild.builds.builder",
    "roles/cloudbuild.serviceAgent",
    "roles/artifactregistry.admin"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Create custom role for ML pipeline specific permissions
resource "google_project_iam_custom_role" "ml_pipeline_custom_role" {
  role_id     = "${var.app_name}_ml_pipeline_custom_role"
  title       = "ML Pipeline Custom Role"
  description = "Custom role for ML pipeline with specific permissions"
  
  permissions = [
    "compute.instances.create",
    "compute.instances.delete",
    "compute.instances.get",
    "compute.instances.list",
    "compute.instances.start",
    "compute.instances.stop",
    "compute.instances.setMetadata",
    "compute.instances.setServiceAccount",
    "compute.instances.setTags",
    "compute.disks.create",
    "compute.disks.delete",
    "compute.disks.get",
    "compute.disks.use",
    "compute.networks.use",
    "compute.subnetworks.use",
    "compute.subnetworks.useExternalIp",
    "storage.buckets.create",
    "storage.buckets.delete",
    "storage.buckets.get",
    "storage.buckets.list",
    "storage.objects.create",
    "storage.objects.delete",
    "storage.objects.get",
    "storage.objects.list",
    "aiplatform.customJobs.create",
    "aiplatform.customJobs.get",
    "aiplatform.customJobs.list",
    "aiplatform.customJobs.cancel",
    "aiplatform.models.create",
    "aiplatform.models.get",
    "aiplatform.models.list",
    "aiplatform.models.upload",
    "aiplatform.endpoints.create",
    "aiplatform.endpoints.get",
    "aiplatform.endpoints.list",
    "aiplatform.endpoints.predict"
  ]
  
  depends_on = [google_project_service.ml_apis]
}

# Assign custom role to ML pipeline service account
resource "google_project_iam_member" "ml_pipeline_custom_role_assignment" {
  project = var.project_id
  role    = google_project_iam_custom_role.ml_pipeline_custom_role.id
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [
    google_service_account.ml_pipeline_sa,
    google_project_iam_custom_role.ml_pipeline_custom_role
  ]
}

# Create a dedicated service account for Vertex AI training jobs
resource "google_service_account" "ml_training_sa" {
  account_id   = "${var.app_name}-ml-training"
  display_name = "ML Training Service Account"
  description  = "Service account specifically for ML training jobs"

  depends_on = [google_project_service.ml_apis]
}

# Training service account permissions
resource "google_project_iam_member" "ml_training_permissions" {
  for_each = toset([
    "roles/storage.objectAdmin",
    "roles/aiplatform.user",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_training_sa.email}"

  depends_on = [google_service_account.ml_training_sa]
}

# Create workload identity binding for Kubernetes (if using GKE)
resource "google_service_account_iam_member" "ml_pipeline_workload_identity" {
  count = var.enable_auto_scaling ? 1 : 0
  
  service_account_id = google_service_account.ml_pipeline_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[ml-pipeline/ml-pipeline-ksa]"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Create Cloud Functions invoker role for API access
resource "google_project_iam_member" "ml_pipeline_functions_invoker" {
  for_each = toset([
    "allUsers",  # For public API access (consider restricting this)
    "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
  ])

  project = var.project_id
  role    = "roles/cloudfunctions.invoker"
  member  = each.value

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Create IAM policy for Cloud Functions
resource "google_project_iam_member" "ml_pipeline_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Create service account for monitoring and alerting
resource "google_service_account" "ml_monitoring_sa" {
  count = var.enable_monitoring ? 1 : 0
  
  account_id   = "${var.app_name}-ml-monitoring"
  display_name = "ML Monitoring Service Account"
  description  = "Service account for ML pipeline monitoring and alerting"

  depends_on = [google_project_service.ml_apis]
}

# Monitoring service account permissions
resource "google_project_iam_member" "ml_monitoring_permissions" {
  for_each = var.enable_monitoring ? toset([
    "roles/monitoring.editor",
    "roles/logging.viewer",
    "roles/pubsub.publisher",
    "roles/pubsub.subscriber"
  ]) : toset([])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_monitoring_sa[0].email}"

  depends_on = [google_service_account.ml_monitoring_sa]
}

# Create notification service account for email alerts
resource "google_service_account" "ml_notification_sa" {
  count = var.enable_notifications ? 1 : 0
  
  account_id   = "${var.app_name}-ml-notifications"
  display_name = "ML Notification Service Account"
  description  = "Service account for ML pipeline notifications"

  depends_on = [google_project_service.ml_apis]
}

# Notification service account permissions
resource "google_project_iam_member" "ml_notification_permissions" {
  for_each = var.enable_notifications ? toset([
    "roles/pubsub.subscriber",
    "roles/secretmanager.secretAccessor"
  ]) : toset([])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ml_notification_sa[0].email}"

  depends_on = [google_service_account.ml_notification_sa]
}

# Create IAM conditions for time-based access (optional)
resource "google_project_iam_member" "ml_pipeline_time_based_access" {
  count = var.enable_cost_optimization ? 1 : 0
  
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  condition {
    title       = "Time-based access for ML pipeline"
    description = "Only allow compute instance creation during business hours"
    expression  = "request.time.getHours() >= 8 && request.time.getHours() <= 18"
  }

  depends_on = [google_service_account.ml_pipeline_sa]
}

# Create IAM binding for Secret Manager access
resource "google_secret_manager_secret_iam_member" "ml_pipeline_secret_access" {
  count = var.enable_secret_manager ? 1 : 0
  
  secret_id = google_secret_manager_secret.ml_pipeline_service_account_key[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"

  depends_on = [
    google_service_account.ml_pipeline_sa,
    google_secret_manager_secret.ml_pipeline_service_account_key
  ]
}

# Output service account emails for reference
output "ml_pipeline_service_account_email" {
  description = "Email of the ML pipeline service account"
  value       = google_service_account.ml_pipeline_sa.email
}

output "ml_training_service_account_email" {
  description = "Email of the ML training service account"
  value       = google_service_account.ml_training_sa.email
}

output "ml_monitoring_service_account_email" {
  description = "Email of the ML monitoring service account"
  value       = var.enable_monitoring ? google_service_account.ml_monitoring_sa[0].email : null
}