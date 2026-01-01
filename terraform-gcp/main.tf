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

# Create firewall rule for Cloud SQL (PostgreSQL)
resource "google_compute_firewall" "allow_cloudsql" {
  name    = "allow-cloudsql"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["5432"]
  }

  # Allow from all internal IPs in the VPC and from private services range
  source_ranges = ["10.128.0.0/9", "10.43.0.0/16"]
}

# Create firewall rule for ICMP (ping) for troubleshooting
resource "google_compute_firewall" "allow_icmp" {
  name    = "allow-icmp"
  network = "default"

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.128.0.0/9", "10.43.0.0/16"]
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

  tags = ["http-server", "https-server", "cloudsql-client"]  # Add the cloudsql-client tag

  # Use the default compute service account
  service_account {
    scopes = ["cloud-platform"]
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-2204-lts"
      size  = 20  # Size in GB
      type  = "pd-balanced"  # Performance balanced persistent disk
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

    # Configure Nginx as reverse proxy with correct server_name
    cat > /etc/nginx/sites-available/default <<'EOL'
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

    # Set client body size to 100M
    client_max_body_size 100M;

    server {
        listen 80;
        server_name streetrankings.com www.streetrankings.com;

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
      certbot --nginx --non-interactive --agree-tos --email jordanddisch@streetrankings.com -d streetrankings.com -d www.streetrankings.com
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

# Create Cloud SQL Database Instance
resource "google_sql_database_instance" "street_rankings_db" {
  name             = "street-rankings"
  database_version = "POSTGRES_15"
  region          = "australia-southeast1"
  
  settings {
    tier = "db-f1-micro"  # Smallest instance for development
    
    # Enable backups
    backup_configuration {
      enabled    = true
      start_time = "03:00"  # 3 AM backup time
      backup_retention_settings {
        retained_backups = 7
      }
    }
    
    # IP configuration
    ip_configuration {
      ipv4_enabled = true  # Enable public IP for Cloud SQL Proxy access from GitHub Actions
      private_network = data.google_compute_network.default.id

      # No authorized networks needed - Cloud SQL Proxy uses IAM authentication
      # This means only authenticated service accounts can connect
    }
  }
  
  # Protect against accidental deletion
  lifecycle {
    prevent_destroy = true
  }
  
  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Create database
resource "google_sql_database" "street_rankings_database" {
  name     = "streetrankings"
  instance = google_sql_database_instance.street_rankings_db.name
}

# Create database user
resource "google_sql_user" "street_rankings_user" {
  name     = "streetrankings"
  instance = google_sql_database_instance.street_rankings_db.name
  password = var.db_password  # You'll need to define this variable
}

# Get default network
data "google_compute_network" "default" {
  name = "default"
}

# Reserve IP range for private services
resource "google_compute_global_address" "private_ip_address" {
  name          = "private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = data.google_compute_network.default.id
}

# Create private connection
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = data.google_compute_network.default.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# Create firewall rule for OpenVPN
resource "google_compute_firewall" "allow_openvpn" {
  name    = "allow-openvpn"
  network = "default"

  allow {
    protocol = "udp"
    ports    = ["1194"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["openvpn-server"]
}

# Create OpenVPN server instance
resource "google_compute_instance" "openvpn_server" {
  name         = "openvpn-server"
  machine_type = "e2-micro"
  zone         = "australia-southeast1-b"

  tags = ["openvpn-server"]

  # Use the default compute service account
  service_account {
    scopes = ["cloud-platform"]
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-2204-lts"
      size  = 10  # Size in GB
      type  = "pd-standard"
    }
  }

  network_interface {
    network = "default"
    # This will get an ephemeral public IP
    access_config {}
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Install OpenVPN and Easy-RSA
    apt-get install -y openvpn easy-rsa
    
    # Create directory structure
    mkdir -p /etc/openvpn/easy-rsa
    cp -r /usr/share/easy-rsa/* /etc/openvpn/easy-rsa/
    
    # Initialize PKI
    cd /etc/openvpn/easy-rsa
    ./easyrsa init-pki
    
    # Build CA (non-interactive)
    echo 'set_var EASYRSA_BATCH "yes"' >> vars
    echo 'set_var EASYRSA_REQ_CN "StreetRankings-CA"' >> vars
    ./easyrsa build-ca nopass
    
    # Generate server certificate
    ./easyrsa gen-req server nopass
    ./easyrsa sign-req server server
    
    # Generate Diffie-Hellman parameters
    ./easyrsa gen-dh
    
    # Generate ta.key for additional security
    openvpn --genkey --secret ta.key
    
    # Copy certificates to OpenVPN directory
    cp pki/ca.crt /etc/openvpn/
    cp pki/issued/server.crt /etc/openvpn/
    cp pki/private/server.key /etc/openvpn/
    cp pki/dh.pem /etc/openvpn/
    cp ta.key /etc/openvpn/
    
    # Create server configuration
    cat > /etc/openvpn/server.conf <<'OVPN'
    port 1194
    proto udp
    dev tun
    
    ca ca.crt
    cert server.crt
    key server.key
    dh dh.pem
    
    server 10.8.0.0 255.255.255.0
    
    # Push routes to clients for GCP internal network
    push "route 10.128.0.0 255.255.240.0"
    push "route 10.132.0.0 255.255.240.0"
    push "route 172.16.0.0 255.255.0.0"
    
    # Push DNS servers
    push "dhcp-option DNS 8.8.8.8"
    push "dhcp-option DNS 8.8.4.4"
    
    ifconfig-pool-persist ipp.txt
    
    keepalive 10 120
    
    tls-auth ta.key 0
    cipher AES-256-CBC
    
    user nobody
    group nogroup
    
    persist-key
    persist-tun
    
    status openvpn-status.log
    log-append /var/log/openvpn.log
    verb 3
    
    # Explicit exit notify
    explicit-exit-notify 1
    OVPN
    
    # Enable IP forwarding
    echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
    sysctl -p
    
    # Configure iptables for NAT
    iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o ens4 -j MASQUERADE
    iptables -A INPUT -i tun+ -j ACCEPT
    iptables -A FORWARD -i tun+ -j ACCEPT
    iptables -A FORWARD -i tun+ -o ens4 -m state --state RELATED,ESTABLISHED -j ACCEPT
    iptables -A FORWARD -i ens4 -o tun+ -m state --state RELATED,ESTABLISHED -j ACCEPT
    
    # Save iptables rules
    apt-get install -y iptables-persistent
    iptables-save > /etc/iptables/rules.v4
    
    # Start and enable OpenVPN
    systemctl start openvpn@server
    systemctl enable openvpn@server
    
    # Create client certificate generation script
    cat > /root/generate-client.sh <<'CLIENTSCRIPT'
    #!/bin/bash
    CLIENT_NAME=$1
    if [ -z "$CLIENT_NAME" ]; then
        echo "Usage: $0 <client_name>"
        exit 1
    fi
    
    cd /etc/openvpn/easy-rsa
    ./easyrsa gen-req $CLIENT_NAME nopass
    ./easyrsa sign-req client $CLIENT_NAME
    
    # Create client config
    cat > /root/$CLIENT_NAME.ovpn <<CLIENTCONF
    client
    dev tun
    proto udp
    remote $(curl -s ifconfig.me) 1194
    resolv-retry infinite
    nobind
    persist-key
    persist-tun
    
    <ca>
    $(cat /etc/openvpn/ca.crt)
    </ca>
    
    <cert>
    $(cat /etc/openvpn/easy-rsa/pki/issued/$CLIENT_NAME.crt)
    </cert>
    
    <key>
    $(cat /etc/openvpn/easy-rsa/pki/private/$CLIENT_NAME.key)
    </key>
    
    <tls-auth>
    $(cat /etc/openvpn/ta.key)
    </tls-auth>
    key-direction 1
    
    cipher AES-256-CBC
    verb 3
    CLIENTCONF
    
    echo "Client configuration created at /root/$CLIENT_NAME.ovpn"
    CLIENTSCRIPT
    
    chmod +x /root/generate-client.sh
    
    # Generate a default client certificate
    /root/generate-client.sh streetrankings-admin
    
    echo "OpenVPN setup complete!"
    echo "To create additional client certificates, run: /root/generate-client.sh <client_name>"
    echo "Client config files will be created in /root/"
  EOF
}

# Output the database connection details
output "database_connection_name" {
  value = google_sql_database_instance.street_rankings_db.connection_name
}

output "database_private_ip" {
  value = google_sql_database_instance.street_rankings_db.private_ip_address
}

output "openvpn_server_ip" {
  value = google_compute_instance.openvpn_server.network_interface[0].access_config[0].nat_ip
}

# Variable for database password
variable "db_password" {
  description = "Password for the database user"
  type        = string
  sensitive   = true
}

# Variable for GitHub Actions service account
variable "github_actions_sa_email" {
  description = "Email of the service account used by GitHub Actions"
  type        = string
}

# Grant Cloud SQL Client role to GitHub Actions service account
# This allows the service account to connect via Cloud SQL Proxy
resource "google_project_iam_member" "github_actions_cloudsql_client" {
  project = "tilligery-connect"
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${var.github_actions_sa_email}"
}
