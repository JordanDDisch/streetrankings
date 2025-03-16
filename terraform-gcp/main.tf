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

# Create firewall rule for HTTPS
resource "google_compute_firewall" "allow_https" {
  name    = "allow-https"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["https-server"]
}

# Create a static external IP address
resource "google_compute_address" "static_ip" {
  name   = "streetrankings-static-ip"
  region = "australia-southeast1"
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

    # Use the reserved static IP
    access_config {
      nat_ip = google_compute_address.static_ip.address
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

    # Install Google Cloud SDK
    apt-get install -y apt-transport-https ca-certificates gnupg
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
    apt-get update && apt-get install -y google-cloud-cli

    # Configure Docker authentication for Artifact Registry
    gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

    # Configure Nginx as reverse proxy
    cat > /etc/nginx/sites-available/default <<'EOL'
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

    # Set client body size to 100M
    client_max_body_size 100M;

    server {
        listen 80;
        server_name _;

        # Enable rate limiting
        limit_req zone=mylimit burst=20 nodelay;

        # Increase timeouts for large uploads
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;

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

    # Install certbot for Let's Encrypt
    apt-get install -y certbot python3-certbot-nginx

    # Create a script to obtain certificates that will run after DNS propagation
    cat > /root/setup-ssl.sh <<'SSLSCRIPT'
    #!/bin/bash
    
    # Check if DNS is properly configured
    DOMAIN="streetrankings.com"
    SERVER_IP=$(curl -s ifconfig.me)
    DOMAIN_IP=$(dig +short $DOMAIN)
    
    # Only proceed if DNS is pointing to this server
    if [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
      certbot --nginx --non-interactive --agree-tos --email your-email@example.com -d streetrankings.com -d www.streetrankings.com
      echo "SSL certificates installed successfully!"
    else
      echo "DNS not yet propagated. Will try again later."
      # Schedule another attempt in 30 minutes
      (crontab -l 2>/dev/null; echo "*/30 * * * * /bin/bash /root/setup-ssl.sh") | crontab -
    fi
    SSLSCRIPT
    
    chmod +x /root/setup-ssl.sh
    
    # Add to crontab to run every 30 minutes until successful
    (crontab -l 2>/dev/null; echo "*/30 * * * * /bin/bash /root/setup-ssl.sh") | crontab -
    
    # Start Nginx with HTTP first
    systemctl restart nginx
  EOF
}

# Create a Cloud Storage bucket
resource "google_storage_bucket" "street_rankings_bucket" {
  name          = "street-rankings"
  location      = "australia-southeast1"
  force_destroy = false
  
  # Optional: Configure versioning
  versioning {
    enabled = true
  }
  
  # Optional: Configure lifecycle rules
  lifecycle_rule {
    condition {
      age = 90  # days
    }
    action {
      type = "Delete"
    }
  }
  
  # Protect against accidental deletion
  lifecycle {
    prevent_destroy = true
  }
}
