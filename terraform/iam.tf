resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.app_name}-cloud-run"
  display_name = "VoiceCast Cloud Run Service Account"
  description  = "Service account for VoiceCast Cloud Run service"
}

resource "google_project_iam_member" "cloud_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_storage_bucket_iam_member" "reference_audios_access" {
  bucket = google_storage_bucket.reference_audios.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_storage_bucket_iam_member" "generated_audios_access" {
  bucket = google_storage_bucket.generated_audios.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_storage_bucket_iam_member" "training_datasets_access" {
  bucket = google_storage_bucket.training_datasets.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_cloud_run_service_iam_binding" "public_access" {
  location = google_cloud_run_v2_service.voicecast_app.location
  service  = google_cloud_run_v2_service.voicecast_app.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}