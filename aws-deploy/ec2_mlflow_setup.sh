#!/bin/bash
# EC2 MLflow Setup Script
# Usage: Run on a fresh Ubuntu instance

# 1. Update and install Docker
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce

# 2. Create data directory
mkdir -p ~/mlflow_data

# 3. Prompt for AWS configuration (or use IAM role if attached)
# Best practice is to attach an IAM role to EC2 with S3 access
# If using ENV vars:
# export AWS_ACCESS_KEY_ID=...
# export AWS_SECRET_ACCESS_KEY=...
# export S3_BUCKET_NAME=...

# 4. Run MLflow container
# We use the official image or build a simple one
PORT=5000
docker pull ghcr.io/mlflow/mlflow:latest

sudo docker run -d \
  --name mlflow-server \
  -p $PORT:$PORT \
  -v ~/mlflow_data:/app/mlflow_data \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -e AWS_DEFAULT_REGION=us-east-1 \
  ghcr.io/mlflow/mlflow:latest \
  mlflow server \
    --backend-store-uri sqlite:///app/mlflow_data/mlflow.db \
    --default-artifact-root s3://$S3_BUCKET_NAME/mlflow-artifacts/ \
    --host 0.0.0.0 \
    --port $PORT

echo "🚀 MLflow server is starting on port $PORT"
echo "Ensure your Security Group allows inbound traffic on port $PORT"
