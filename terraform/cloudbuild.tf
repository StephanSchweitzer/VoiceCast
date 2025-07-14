resource "google_secret_manager_secret" "github_token_secret" {
  project   = var.project_id
  secret_id = "github-pat-token"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "github_token_secret_version" {
  secret      = google_secret_manager_secret.github_token_secret.id
  secret_data = var.github_personal_access_token
}

data "google_project" "project" {
  project_id = var.project_id
}

data "google_iam_policy" "serviceagent_secretAccessor" {
  binding {
    role = "roles/secretmanager.secretAccessor"
    members = ["serviceAccount:service-${data.google_project.project.number}@gcp-sa-cloudbuild.iam.gserviceaccount.com"]
  }
}

resource "google_secret_manager_secret_iam_policy" "policy" {
  project     = google_secret_manager_secret.github_token_secret.project
  secret_id   = google_secret_manager_secret.github_token_secret.secret_id
  policy_data = data.google_iam_policy.serviceagent_secretAccessor.policy_data
}

resource "google_cloudbuildv2_connection" "github_connection" {
  project  = var.project_id
  location = var.region
  name     = "${var.app_name}-github-connection"

  github_config {
    app_installation_id = var.github_app_installation_id
    authorizer_credential {
      oauth_token_secret_version = google_secret_manager_secret_version.github_token_secret_version.id
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_iam_policy.policy
  ]
}

resource "google_cloudbuildv2_repository" "voicecast_repo_connection" {
  project           = var.project_id
  location          = var.region
  name              = "voicecast-repo"
  parent_connection = google_cloudbuildv2_connection.github_connection.name
  remote_uri        = "https://github.com/${var.github_repo_owner}/${var.github_repo_name}.git"
}

resource "google_cloudbuild_trigger" "voicecast_build" {
  project  = var.project_id
  name     = "${var.app_name}-build-trigger"
  location = var.region

  service_account = google_service_account.cloudbuild_sa.id

  repository_event_config {
    repository = google_cloudbuildv2_repository.voicecast_repo_connection.id
    push {
      branch = "^${var.github_branch}$"
    }
  }

  included_files = concat(var.app_file_patterns, var.api_file_patterns)
  ignored_files  = var.ignored_file_patterns

  filename = "cloudbuild.yaml"

  substitutions = {
    _NEXTJS_IMAGE_URL = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}/${var.app_name}-app"
    _TTS_IMAGE_URL    = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}/${var.app_name}-tts"
    _REGION           = var.region
  }

  disabled = !var.trigger_on_push

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.voicecast_repo,
    google_cloudbuildv2_repository.voicecast_repo_connection,
    google_service_account.cloudbuild_sa
  ]
}

resource "google_service_account" "cloudbuild_sa" {
  account_id   = "${var.app_name}-cloudbuild"
  display_name = "VoiceCast Cloud Build Service Account"
  description  = "Service account for Cloud Build operations"
}

resource "google_project_iam_member" "cloudbuild_builder" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.builder"
  member  = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

resource "google_project_iam_member" "cloudbuild_run_developer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

resource "google_project_iam_member" "cloudbuild_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

resource "google_project_iam_member" "cloudbuild_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

resource "google_project_iam_member" "cloudbuild_storage" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild_sa.email}"
}

resource "null_resource" "trigger_initial_build" {
  triggers = {
    nextjs_image_url = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}/${var.app_name}-app:latest"
    tts_image_url    = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}/${var.app_name}-tts:latest"
    trigger_id       = google_cloudbuild_trigger.voicecast_build.id
  }

  provisioner "local-exec" {
    command = "gcloud builds triggers run ${google_cloudbuild_trigger.voicecast_build.name} --branch=${var.github_branch} --region=${var.region} --project=${var.project_id}"
  }

  depends_on = [
    google_cloudbuild_trigger.voicecast_build,
    google_artifact_registry_repository.voicecast_repo
  ]
}