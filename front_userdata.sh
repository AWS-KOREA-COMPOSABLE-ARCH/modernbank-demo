#!/bin/bash

# Log file setup
LOGFILE="/var/log/modernbank-setup.log"
exec > >(tee -a ${LOGFILE}) 2>&1

# Update system packages
echo "Updating system packages..."
apt-get update -y && apt-get upgrade -y

# Install Git
echo "Installing Git..."
apt-get install -y git

# Install Node.js 20
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Check Node.js version
echo "Node.js version:"
node --version
echo "npm version:"
npm --version

# Create application directory
APP_DIR="/opt"
echo "Creating application directory: ${APP_DIR}"
mkdir -p ${APP_DIR}

# Clone the repository
echo "Cloning the repository..."
REPO_URL="https://github.com/sharplee7/modernbank-demo.git" # Replace with the actual Git repository URL
git clone ${REPO_URL} 
cd modernbank-demo
mv ./modernbank_ui ${APP_DIR}/modernbank_ui

APP_DIR="/opt/modernbank_ui"

# Move to application directory
cd ${APP_DIR}

# Install dependencies
echo "Installing dependencies..."
npm ci

# Create environment variable file
echo "Creating .env.production file..."
cat << EOL > .env.production
# Common API base URL
NEXT_PUBLIC_API_BASE_URL=http://internal-k8s-modernba-modernba-0837b1f6e6-1217569516.ap-northeast-2.elb.amazonaws.com

# Service endpoints
NEXT_PUBLIC_AUTH=http://internal-k8s-modernba-modernba-0837b1f6e6-1217569516.ap-northeast-2.elb.amazonaws.com/user
NEXT_PUBLIC_CUSTOMER=http://internal-k8s-modernba-modernba-0837b1f6e6-1217569516.ap-northeast-2.elb.amazonaws.com/customer
NEXT_PUBLIC_TRANSFER=http://internal-k8s-modernba-modernba-0837b1f6e6-1217569516.ap-northeast-2.elb.amazonaws.com/transfer
NEXT_PUBLIC_ACCOUNT=http://internal-k8s-modernba-modernba-0837b1f6e6-1217569516.ap-northeast-2.elb.amazonaws.com/account
NEXT_PUBLIC_CQRS=http://internal-k8s-modernba-modernba-0837b1f6e6-1217569516.ap-northeast-2.elb.amazonaws.com/cqrs
NEXT_PUBLIC_PRODUCT=http://internal-k8s-modernba-modernba-0837b1f6e6-1217569516.ap-northeast-2.elb.amazonaws.com/product
EOL

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Create systemd service file
echo "Creating systemd service..."
cat << EOL > /etc/systemd/system/modernbank-ui.service
[Unit]
Description=ModernBank UI Next.js Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOL

# Enable and start systemd service
echo "Enabling and starting systemd service..."
systemctl daemon-reload
systemctl enable modernbank-ui.service
systemctl start modernbank-ui.service

# Check service status
echo "Service status:"
systemctl status modernbank-ui.service
