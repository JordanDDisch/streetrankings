terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.8.0"
    }
  }
}

provider "google" {
  project = "tilligery-connect"
  region  = "australia-southeast1"
  zone    = "australia-southeast1-b"
}

# Get the project information
data "google_project" "project" {}

# Create Artifact Registry Repository
resource "google_artifact_registry_repository" "docker_repo" {
  location      = "australia-southeast1"
  repository_id = "streetrankings"
  description   = "Docker repository for Street Rankings"
  format        = "DOCKER"

  # Protect against accidental deletion
  lifecycle {
    prevent_destroy = true
  }

  # Configure cleanup policies
  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "DELETE"
    condition {
      tag_state    = "TAGGED"
      older_than   = "2592000s"  # 30 days
      tag_prefixes = ["v"]
    }
  }
}

# Grant the default compute service account access to Artifact Registry
resource "google_artifact_registry_repository_iam_member" "compute_reader" {
  project    = "tilligery-connect"
  location   = "australia-southeast1"
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

# Create firewall rule for HTTP
resource "google_compute_firewall" "allow_http" {
  name    = "allow-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server"]
}

resource "google_compute_instance" "vm_instance" {
  name         = "streetrankings-server"
  machine_type = "e2-medium"
  zone         = "australia-southeast1-b"

  tags = ["http-server"]  # Add the http-server tag

  # Use the default compute service account
  service_account {
    scopes = ["cloud-platform"]
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-2204-lts"
    }
  }

  network_interface {
    network = "default"

    # Add external IP
    access_config {
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash

    # Script Vars
    SWAP_SIZE="1G"  # Swap size of 1GB
    REGION="australia-southeast1"

    # Update package list and upgrade existing packages
    apt-get update && apt-get upgrade -y

    # Add Swap Space
    echo "Adding swap space..."
    fallocate -l $SWAP_SIZE /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile

    # Make swap permanent
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

    # Install prerequisites
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common nginx

    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

    # Add Docker repository
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y

    # Update package lists again
    apt-get update

    # Install Docker CE
    apt-get install -y docker-ce docker-ce-cli containerd.io

    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

    # Start and enable Docker service
    systemctl start docker
    systemctl enable docker

    # Configure Docker to use GCR
    gcloud auth configure-docker --quiet

    # Configure Nginx as reverse proxy
    cat > /etc/nginx/sites-available/default <<'EOL'
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

    server {
        listen 80;
        server_name _;

        # Enable rate limiting
        limit_req zone=mylimit burst=20 nodelay;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;

            # Disable buffering for streaming support
            proxy_buffering off;
            proxy_set_header X-Accel-Buffering no;
        }
    }
    EOL

    # Restart Nginx to apply the new configuration
    systemctl restart nginx
  EOF
}
