#!/bin/bash

# Configuration
APP_NAME="research-iq"
REGION="us-east-1"
S3_BUCKET_NAME="${APP_NAME}-demo-$(date +%s)"
BACKEND_IMAGE_NAME="${APP_NAME}-backend"
FRONTEND_IMAGE_NAME="${APP_NAME}-frontend"

echo "🚀 Starting AWS Deployment for ${APP_NAME}"

# 1. Create S3 Bucket
echo "📦 Creating S3 Bucket: ${S3_BUCKET_NAME}"
aws s3 mb "s3://${S3_BUCKET_NAME}" --region ${REGION}

# 2. Setup ECR Repositories
echo "🐳 Setting up ECR Repositories"
aws ecr create-repository --repository-name ${BACKEND_IMAGE_NAME} --region ${REGION} || echo "Repo already exists"
aws ecr create-repository --repository-name ${FRONTEND_IMAGE_NAME} --region ${REGION} || echo "Repo already exists"

# Login to ECR
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# 3. Build and Push Backend
echo "🔨 Building and Pushing Backend"
cd backend
docker build -t ${BACKEND_IMAGE_NAME} .
docker tag ${BACKEND_IMAGE_NAME}:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${BACKEND_IMAGE_NAME}:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${BACKEND_IMAGE_NAME}:latest
cd ..

# 4. Build and Push Frontend
echo "🔨 Building and Pushing Frontend"
cd research-platform
# We need to pass the Backend URL for the build
# For simplicity in this demo, we'll assume the backend URL is determined after first deploy
# Or we can provide a dummy one and update the service later.
docker build -t ${FRONTEND_IMAGE_NAME} --build-arg VITE_BACKEND_URL=REPLACE_ME .
docker tag ${FRONTEND_IMAGE_NAME}:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${FRONTEND_IMAGE_NAME}:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${FRONTEND_IMAGE_NAME}:latest
cd ..

# 5. Create App Runner Service for Backend
echo "☁️ Creating App Runner Service for Backend"
# Create an IAM role for App Runner if it doesn't exist
# (Simplified for demo scripts - usually involves creating a trust policy JSON)

aws apprunner create-service \
    --service-name "${APP_NAME}-backend" \
    --source-configuration '{
        "ImageRepository": {
            "ImageIdentifier": "'${ACCOUNT_ID}'.dkr.ecr.'${REGION}'.amazonaws.com/'${BACKEND_IMAGE_NAME}':latest",
            "ImageConfiguration": {
                "Port": "8000",
                "RuntimeEnvironmentVariables": [
                    {"Name": "GEMINI_API_KEY", "Value": "'${GEMINI_API_KEY}'"},
                    {"Name": "S3_BUCKET_NAME", "Value": "'${S3_BUCKET_NAME}'"}
                ]
            },
            "ImageRepositoryType": "ECR"
        },
        "AutoDeploymentsEnabled": true
    }' \
    --region ${REGION}

echo "✅ Deployment Scripts Ready!"
echo "Next Steps:"
echo "1. Run this script: bash aws-deploy/deploy.sh"
echo "2. Get the Backend URL from AWS Console"
echo "3. Re-build and Push Frontend with the correct VITE_BACKEND_URL"
echo "4. Create App Runner service for Frontend"
