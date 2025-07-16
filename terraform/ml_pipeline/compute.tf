# Compute resources for ML pipeline training

# Instance template for training jobs
resource "google_compute_instance_template" "ml_training_template" {
  name_prefix = "${var.app_name}-ml-training-"
  
  machine_type = var.training_machine_type
  region       = var.region
  
  # Use preemptible instances for cost optimization
  scheduling {
    preemptible                 = var.use_preemptible_instances
    automatic_restart           = !var.use_preemptible_instances
    on_host_maintenance         = var.use_preemptible_instances ? "TERMINATE" : "MIGRATE"
    provisioning_model          = var.use_preemptible_instances ? "SPOT" : "STANDARD"
    instance_termination_action = var.use_preemptible_instances ? "STOP" : null
  }
  
  # Disk configuration
  disk {
    source_image = "projects/ml-images/global/images/family/tf-2-11-gpu-ubuntu-2004"
    auto_delete  = true
    boot         = true
    disk_size_gb = var.training_disk_size
    disk_type    = var.training_disk_type
  }
  
  # Network configuration
  network_interface {
    network = "default"
    access_config {
      // Ephemeral IP
    }
  }
  
  # GPU configuration
  dynamic "guest_accelerator" {
    for_each = var.enable_gpu_training ? [1] : []
    content {
      type  = var.gpu_type
      count = var.gpu_count
    }
  }
  
  # Service account
  service_account {
    email  = google_service_account.ml_pipeline_sa.email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
  
  # Metadata
  metadata = {
    enable-oslogin = "TRUE"
    startup-script = templatefile("${path.module}/scripts/training_startup.sh", {
      project_id = var.project_id
      region     = var.region
      models_bucket = google_storage_bucket.ml_models.name
      processed_data_bucket = google_storage_bucket.ml_processed_data.name
    })
  }
  
  # Labels
  labels = merge(var.labels, {
    type = "training"
  })
  
  # Lifecycle
  lifecycle {
    create_before_destroy = true
  }
  
  depends_on = [
    google_project_service.ml_apis,
    google_service_account.ml_pipeline_sa
  ]
}

# Instance template for data processing jobs
resource "google_compute_instance_template" "ml_data_processing_template" {
  name_prefix = "${var.app_name}-ml-data-processing-"
  
  machine_type = "n1-standard-4"
  region       = var.region
  
  # Use preemptible instances for cost optimization
  scheduling {
    preemptible                 = var.use_preemptible_instances
    automatic_restart           = !var.use_preemptible_instances
    on_host_maintenance         = var.use_preemptible_instances ? "TERMINATE" : "MIGRATE"
    provisioning_model          = var.use_preemptible_instances ? "SPOT" : "STANDARD"
    instance_termination_action = var.use_preemptible_instances ? "STOP" : null
  }
  
  # Disk configuration
  disk {
    source_image = "projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts"
    auto_delete  = true
    boot         = true
    disk_size_gb = 100
    disk_type    = "pd-ssd"
  }
  
  # Network configuration
  network_interface {
    network = "default"
    access_config {
      // Ephemeral IP
    }
  }
  
  # Service account
  service_account {
    email  = google_service_account.ml_pipeline_sa.email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
  
  # Metadata
  metadata = {
    enable-oslogin = "TRUE"
    startup-script = templatefile("${path.module}/scripts/data_processing_startup.sh", {
      project_id = var.project_id
      region     = var.region
      raw_data_bucket = google_storage_bucket.ml_raw_data.name
      processed_data_bucket = google_storage_bucket.ml_processed_data.name
      models_bucket = google_storage_bucket.ml_models.name
    })
  }
  
  # Labels
  labels = merge(var.labels, {
    type = "data-processing"
  })
  
  # Lifecycle
  lifecycle {
    create_before_destroy = true
  }
  
  depends_on = [
    google_project_service.ml_apis,
    google_service_account.ml_pipeline_sa
  ]
}

# Managed Instance Group for training jobs (optional, for auto-scaling)
resource "google_compute_region_instance_group_manager" "ml_training_group" {
  count = var.enable_auto_scaling ? 1 : 0
  
  name   = "${var.app_name}-ml-training-group"
  region = var.region
  
  base_instance_name = "${var.app_name}-ml-training"
  
  version {
    instance_template = google_compute_instance_template.ml_training_template.id
  }
  
  target_size = 0  # Start with 0 instances, scale up when needed
  
  # Auto-healing
  auto_healing_policies {
    health_check      = google_compute_health_check.ml_training_health_check[0].id
    initial_delay_sec = 300
  }
  
  # Update policy
  update_policy {
    type                         = "PROACTIVE"
    instance_redistribution_type = "PROACTIVE"
    minimal_action               = "REPLACE"
    max_surge_fixed              = 1
    max_unavailable_fixed        = 1
  }
  
  depends_on = [google_compute_instance_template.ml_training_template]
}

# Health check for training instances
resource "google_compute_health_check" "ml_training_health_check" {
  count = var.enable_auto_scaling ? 1 : 0
  
  name = "${var.app_name}-ml-training-health-check"
  
  timeout_sec         = 5
  check_interval_sec  = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3
  
  tcp_health_check {
    port = "22"
  }
  
  depends_on = [google_project_service.ml_apis]
}

# Autoscaler for training instances
resource "google_compute_region_autoscaler" "ml_training_autoscaler" {
  count = var.enable_auto_scaling ? 1 : 0
  
  name   = "${var.app_name}-ml-training-autoscaler"
  region = var.region
  target = google_compute_region_instance_group_manager.ml_training_group[0].id
  
  autoscaling_policy {
    max_replicas    = var.max_training_instances
    min_replicas    = 0
    cooldown_period = 300
    
    # Scale based on CPU utilization
    cpu_utilization {
      target = 0.8
    }
    
    # Scale based on custom metrics (optional)
    dynamic "metric" {
      for_each = var.enable_monitoring ? [1] : []
      content {
        name   = "compute.googleapis.com/instance/up"
        target = 1
        type   = "GAUGE"
      }
    }
  }
  
  depends_on = [google_compute_region_instance_group_manager.ml_training_group]
}

# Firewall rules for ML pipeline (if needed)
resource "google_compute_firewall" "ml_pipeline_firewall" {
  name    = "${var.app_name}-ml-pipeline-firewall"
  network = "default"
  
  # Allow internal communication
  allow {
    protocol = "tcp"
    ports    = ["22", "8080", "8888"]  # SSH, HTTP, Jupyter
  }
  
  # Allow from specific source ranges
  source_ranges = ["10.0.0.0/8"]
  
  # Target tags
  target_tags = ["ml-pipeline"]
  
  depends_on = [google_project_service.ml_apis]
}

# Reservation for GPU instances (optional, for guaranteed capacity)
resource "google_compute_reservation" "ml_gpu_reservation" {
  count = var.enable_gpu_training && var.enable_auto_scaling ? 1 : 0
  
  name = "${var.app_name}-ml-gpu-reservation"
  zone = "${var.region}-a"
  
  specific_reservation {
    count = 1
    instance_properties {
      machine_type = var.training_machine_type
      
      guest_accelerators {
        accelerator_type  = var.gpu_type
        accelerator_count = var.gpu_count
      }
      
      local_ssds {
        disk_size_gb = 375
        interface    = "NVME"
      }
    }
  }
  
  depends_on = [google_project_service.ml_apis]
}

# Disk snapshots for training data (optional)
resource "google_compute_disk" "ml_training_data_disk" {
  count = var.enable_auto_scaling ? 1 : 0
  
  name = "${var.app_name}-ml-training-data-disk"
  zone = "${var.region}-a"
  
  size = 500
  type = "pd-ssd"
  
  labels = merge(var.labels, {
    type = "training-data"
  })
  
  depends_on = [google_project_service.ml_apis]
}

# Snapshot schedule for training data
resource "google_compute_resource_policy" "ml_training_data_snapshot_policy" {
  count = var.enable_auto_scaling ? 1 : 0
  
  name   = "${var.app_name}-ml-training-data-snapshot-policy"
  region = var.region
  
  snapshot_schedule_policy {
    schedule {
      daily_schedule {
        days_in_cycle = 1
        start_time    = "04:00"
      }
    }
    
    retention_policy {
      max_retention_days = 7
    }
    
    snapshot_properties {
      labels = merge(var.labels, {
        type = "training-data-snapshot"
      })
      storage_locations = [var.region]
    }
  }
  
  depends_on = [google_project_service.ml_apis]
}

# Attach snapshot policy to training data disk
resource "google_compute_disk_resource_policy_attachment" "ml_training_data_snapshot_attachment" {
  count = var.enable_auto_scaling ? 1 : 0
  
  name = google_compute_resource_policy.ml_training_data_snapshot_policy[0].name
  disk = google_compute_disk.ml_training_data_disk[0].name
  zone = "${var.region}-a"
  
  depends_on = [
    google_compute_disk.ml_training_data_disk,
    google_compute_resource_policy.ml_training_data_snapshot_policy
  ]
}