terraform {
  backend "gcs" {
    bucket = "voicecast-464815-terraform-state"
    prefix = "voicecast/state"
  }
}
