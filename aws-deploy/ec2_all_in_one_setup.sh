#!/bin/bash
# ResearchIQ All-in-One EC2 Setup Script
# Run this on your Ubuntu EC2 instance

set -e

echo "🚀 Starting All-in-One Setup for ResearchIQ"

# 1. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    sudo apt-get update
    sudo apt-get install -y docker-ce
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to logout and login again for group changes."
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 2. Setup Environment
echo "🔧 Configuring Environment"

# Get Public IP for Frontend
EC2_PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "Detected Public IP: $EC2_PUBLIC_IP"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    read -p "Enter your GEMINI_API_KEY: " GEMINI_API_KEY
    read -p "Enter your S3_BUCKET_NAME (default: researchiq-demo-data): " S3_BUCKET_NAME
    S3_BUCKET_NAME=${S3_BUCKET_NAME:-researchiq-demo-data}
    
    echo "GEMINI_API_KEY=$GEMINI_API_KEY" > .env
    echo "S3_BUCKET_NAME=$S3_BUCKET_NAME" >> .env
    echo "VITE_BACKEND_URL=http://$EC2_PUBLIC_IP:8000" >> .env
    echo "AWS_REGION=us-east-1" >> .env
    
    echo "Created .env file."
else
    echo ".env file already exists. Skipping creation."
fi

# 3. Launch Containers
echo "🏗️ Building and Launching Containers..."
sudo docker-compose up --build -d

echo "--------------------------------------------------------"
echo "✅ SETUP COMPLETE!"
echo "--------------------------------------------------------"
echo "Frontend: http://$EC2_PUBLIC_IP:3000"
echo "Backend:  http://$EC2_PUBLIC_IP:8000"
echo "MLflow:   http://$EC2_PUBLIC_IP:5000"
echo "--------------------------------------------------------"
echo "Note: Ensure your Security Group allows inbound traffic on ports 3000, 5000, and 8000."
