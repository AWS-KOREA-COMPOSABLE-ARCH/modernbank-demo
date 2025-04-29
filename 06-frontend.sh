#!/bin/bash

# Variables
AMI_ID="ami-0d5bb3742db8fc264" # Replace with the appropriate Ubuntu AMI ID for your region
INSTANCE_TYPE="c5.xlarge"
SECURITY_GROUP_NAME="modernbank-ui-sg"
KEY_PAIR_NAME="modernbank-ui-key"
SECURITY_GROUP_DESCRIPTION="Security group for ModernBank UI"

# Fetch the VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=CoreBankInfraStack/CoreBankVPC" --query 'Vpcs[0].VpcId' --output text)
echo "VPC_ID=${VPC_ID}"

# Check if the security group exists

set -e
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text) || true
set +e

if [ "$SECURITY_GROUP_ID" == "None" ]; then
  # Security group does not exist, create a new one
  aws ec2 create-security-group --group-name $SECURITY_GROUP_NAME --description "$SECURITY_GROUP_DESCRIPTION" --vpc-id $VPC_ID --query 'GroupId' --output text >/dev/null 2>&1

  wait

  SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" --query 'SecurityGroups[0].GroupId' --output text)

  # Set security group rules to allow inbound traffic on port 3000 and 22
  aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 >/dev/null 2>&1
  aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 >/dev/null 2>&1
else
  echo "Security group '$SECURITY_GROUP_NAME' already exists with ID: $SECURITY_GROUP_ID"
fi


# Fetch the Ingress address
INGRESS_ADDRESS=$(kubectl get ingress -n modernbank -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}')
echo "INGRESS_ADDRESS=${INGRESS_ADDRESS}"
# Fetch a public subnet ID from the VPC
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=CoreBankInfraStack/CoreBankVPC/core-bank-web-publicSubnet*" --query 'Subnets[].SubnetId' --output text)
echo "SUBNET_IDS=${SUBNET_IDS}"

SUBNET_ID=$(echo $SUBNET_IDS | cut -d ' ' -f 1)

echo "SELECTED_SUBNET_ID=$SUBNET_ID"

# Create the front_userdata.sh file
cat << EOF > front_userdata.sh
#!/bin/bash

# Log file setup
LOGFILE="/var/log/modernbank-setup.log"
exec > >(tee -a \${LOGFILE}) 2>&1

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

# Create application directory and set permissions
APP_DIR="/opt/modernbank_ui"
echo "Creating application directory: \${APP_DIR}"
mkdir -p \${APP_DIR}
chown -R ubuntu:ubuntu /opt

# Clone the repository as ubuntu user
echo "Cloning the repository..."
su - ubuntu -c "
    git clone https://github.com/sharplee7/modernbank-demo.git /home/ubuntu/modernbank-demo
    cp -r /home/ubuntu/modernbank-demo/modernbank_ui/* \${APP_DIR}/
    cd \${APP_DIR}
    npm ci
"

# Install forever globally with sudo
echo "Installing forever globally..."
sudo npm install -g forever

# Create environment variable file
echo "Creating .env.development file..."
cat << EOL > \${APP_DIR}/.env.development
# Common API base URL
NEXT_PUBLIC_API_BASE_URL=http://$INGRESS_ADDRESS/modernbank

# Service endpoints
NEXT_PUBLIC_AUTH=http://$INGRESS_ADDRESS/modernbank/user
NEXT_PUBLIC_CUSTOMER=http://$INGRESS_ADDRESS/modernbank/customer
NEXT_PUBLIC_TRANSFER=http://$INGRESS_ADDRESS/modernbank/transfer
NEXT_PUBLIC_ACCOUNT=http://$INGRESS_ADDRESS/modernbank/account
NEXT_PUBLIC_CQRS=http://$INGRESS_ADDRESS/modernbank/cqrs
NEXT_PUBLIC_PRODUCT=http://$INGRESS_ADDRESS/modernbank/product
EOL

# Set proper ownership for the env file
chown ubuntu:ubuntu \${APP_DIR}/.env.development

# Set proper permissions
chown -R ubuntu:ubuntu \${APP_DIR}
chmod -R 755 \${APP_DIR}

# Ensure npm cache directory exists and has correct permissions
mkdir -p /home/ubuntu/.npm
chown -R ubuntu:ubuntu /home/ubuntu/.npm

# Create a startup script
cat << EOL > \${APP_DIR}/start.sh
#!/bin/bash
cd \${APP_DIR}
export NODE_ENV=development
export PORT=3000
forever start -c "npm run dev" ./
EOL

chmod +x \${APP_DIR}/start.sh
chown ubuntu:ubuntu \${APP_DIR}/start.sh

# Run the application as ubuntu user
su - ubuntu -c "cd \${APP_DIR} && ./start.sh"

# Add the start script to ubuntu user's crontab for restart on reboot
(crontab -u ubuntu -l 2>/dev/null; echo "@reboot /opt/modernbank_ui/start.sh") | crontab -u ubuntu -
EOF



chmod +x ./front_userdata.sh

# Create key pair if it doesn't exist
if ! aws ec2 describe-key-pairs --key-names "$KEY_PAIR_NAME" >/dev/null 2>&1; then
    echo "Creating new key pair: $KEY_PAIR_NAME"
    aws ec2 create-key-pair \
        --key-name "$KEY_PAIR_NAME" \
        --query 'KeyMaterial' \
        --output text > "${KEY_PAIR_NAME}.pem"
    
    # Set correct permissions for the key file
    chmod 400 "${KEY_PAIR_NAME}.pem"
else
    echo "Key pair '$KEY_PAIR_NAME' already exists"
fi


# Create EC2 instance
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name "$KEY_PAIR_NAME" \
    --security-group-ids $SECURITY_GROUP_ID \
    --subnet-id $SUBNET_ID \
    --associate-public-ip-address \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ModernBank-UI}]' \
    --user-data file://front_userdata.sh \
    --query 'Instances[0].InstanceId' \
    --output text)


wait

# # Fetch the public domain of the EC2 instance
PUBLIC_DOMAIN=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicDnsName' --output text)

echo "The ModernBank UI is available at: http://$PUBLIC_DOMAIN:3000"
echo "To connect via SSH: ssh -i ${KEY_PAIR_NAME}.pem ubuntu@$PUBLIC_DOMAIN"

