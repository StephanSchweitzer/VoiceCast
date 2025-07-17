# IAM Service Accounts and Permissions for ML Pipeline

# Service account for ML Pipeline operations
resource "google_service_account" "ml_pipeline_sa" {
  account_id   = "${var.app_name}-ml-pipeline-sa"
  display_name = "ML Pipeline Service Account"
  description  = "Service account for ML pipeline operations including Vertex AI and Cloud Storage"
  project      = var.project_id
}

# Service account for Cloud Run ML API
resource "google_service_account" "ml_api_sa" {
  account_id   = "${var.app_name}-ml-api-sa"
  display_name = "ML API Service Account"
  description  = "Service account for ML pipeline API running on Cloud Run"
  project      = var.project_id
}

# IAM roles for ML Pipeline service account
resource "google_project_iam_member" "ml_pipeline_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
}

resource "google_project_iam_member" "ml_pipeline_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
}

resource "google_project_iam_member" "ml_pipeline_compute_admin" {
  project = var.project_id
  role    = "roles/compute.admin"
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
}

resource "google_project_iam_member" "ml_pipeline_notebook_admin" {
  project = var.project_id
  role    = "roles/notebooks.admin"
  member  = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
}

# IAM roles for ML API service account
resource "google_project_iam_member" "ml_api_storage_object_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.ml_api_sa.email}"
}

resource "google_project_iam_member" "ml_api_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.ml_api_sa.email}"
}

resource "google_project_iam_member" "ml_api_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.ml_api_sa.email}"
}

# Bucket-specific IAM binding for ML Pipeline SA
resource "google_storage_bucket_iam_member" "ml_pipeline_bucket_admin" {
  bucket = google_storage_bucket.ml_pipeline_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.ml_pipeline_sa.email}"
}

# Bucket-specific IAM binding for ML API SA
resource "google_storage_bucket_iam_member" "ml_api_bucket_admin" {
  bucket = google_storage_bucket.ml_pipeline_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.ml_api_sa.email}"
}

# Service account key for ML Pipeline (if needed for local development)
resource "google_service_account_key" "ml_pipeline_key" {
  service_account_id = google_service_account.ml_pipeline_sa.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Secret for storing service account key
resource "google_secret_manager_secret" "ml_pipeline_sa_key" {
  secret_id = "${var.app_name}-ml-pipeline-sa-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.ml_pipeline_apis]
}

resource "google_secret_manager_secret_version" "ml_pipeline_sa_key" {
  secret      = google_secret_manager_secret.ml_pipeline_sa_key.id
  secret_data = base64decode(google_service_account_key.ml_pipeline_key.private_key)
}