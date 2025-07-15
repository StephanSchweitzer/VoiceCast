resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.app_name}-cloud-run"
  display_name = "VoiceCast Cloud Run Service Account"
  description  = "Service account for VoiceCast Cloud Run service"
}

resource "google_project_iam_member" "cloud_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"

  depends_on = [google_project_service.apis]
}

resource "google_storage_bucket_iam_member" "reference_audios_access" {
  bucket = google_storage_bucket.reference_audios.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"

  depends_on = [
    google_storage_bucket.reference_audios,
    google_service_account.cloud_run_sa
  ]
}

resource "google_storage_bucket_iam_member" "generated_audios_access" {
  bucket = google_storage_bucket.generated_audios.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"

  depends_on = [
    google_storage_bucket.generated_audios,
    google_service_account.cloud_run_sa
  ]
}

resource "google_storage_bucket_iam_member" "training_datasets_access" {
  bucket = google_storage_bucket.training_datasets.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"

  depends_on = [
    google_storage_bucket.training_datasets,
    google_service_account.cloud_run_sa
  ]
}

resource "google_project_iam_member" "cloud_run_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"

  depends_on = [
    google_service_account.cloud_run_sa,
    google_project_service.apis
  ]
}

resource "google_cloud_run_service_iam_binding" "public_access" {
  location = google_cloud_run_v2_service.voicecast_app.location
  service  = google_cloud_run_v2_service.voicecast_app.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]

  depends_on = [google_cloud_run_v2_service.voicecast_app]
}

resource "google_project_iam_member" "service_account_token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_service_iam_member" "tts_invoker" {
  location = google_cloud_run_v2_service.voicecast_tts.location
  service  = google_cloud_run_v2_service.voicecast_tts.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloud_run_sa.email}"

  depends_on = [google_project_service.apis]
}

resource "google_cloud_run_service_iam_member" "tts_invoker_personal" {
  location = google_cloud_run_v2_service.voicecast_tts.location
  service  = google_cloud_run_v2_service.voicecast_tts.name
  role     = "roles/run.invoker"
  member   = "user:sschweitzer2@myges.fr"
}