resource "google_cloudbuild_trigger" "voicecast_build" {
  name        = "${var.app_name}-build-trigger"
  description = "Trigger to build VoiceCast application"
  location    = var.region

  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name

    push {
      branch = "^${var.github_branch}$"
    }
  }

  included_files = var.app_file_patterns

  ignored_files = var.ignored_file_patterns

  filename = "cloudbuild.yaml"

  substitutions = {
    _IMAGE_URL = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}/${var.app_name}-app"
    _REGION    = var.region
  }

  disabled = !var.trigger_on_push

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.voicecast_repo
  ]
}

# Service account for Cloud Build
resource "google_service_account" "cloudbuild_sa" {
  account_id   = "${var.app_name}-cloudbuild"
  display_name = "VoiceCast Cloud Build Service Account"
  description  = "Service account for Cloud Build operations"
}

# Grant Cloud Build necessary permissions
resource "google_project_iam_member" "cloudbuild_builder" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.builder"
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

# Allow Cloud Build to trigger the build manually via Terraform
resource "null_resource" "trigger_initial_build" {
  triggers = {
    # This will trigger the build whenever these values change
    image_url = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.voicecast_repo.name}/${var.app_name}-app:latest"
    trigger_id = google_cloudbuild_trigger.voicecast_build.id
  }

  provisioner "local-exec" {
    command = <<-EOT
      gcloud builds triggers run ${google_cloudbuild_trigger.voicecast_build.name} \
        --branch=${var.github_branch} \
        --region=${var.region} \
        --project=${var.project_id}
    EOT
  }

  depends_on = [
    google_cloudbuild_trigger.voicecast_build,
    google_artifact_registry_repository.voicecast_repo
  ]
}