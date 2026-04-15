# AWS Deployment Guide: ResearchIQ Demo

This guide explains how to deploy the ResearchIQ platform to AWS using Docker and App Runner.

## Prerequisites

1.  **AWS CLI**: Configured with `AdminAccess` (or ECR, App Runner, S3 permissions).
2.  **Docker**: Installed and running on your local machine.
3.  **API Key**: A valid `GEMINI_API_KEY`.

## Deployment Steps

### 1. Configure Environment
Before running the deployment script, set your Gemini API key:
```bash
export GEMINI_API_KEY="your_api_key_here"
```

### 2. Run the Deployment Script
This script creates the S3 bucket, ECR repositories, and deploys the backend to App Runner.
```bash
bash aws-deploy/deploy.sh
```

### 3. Deploy Frontend
After the backend is deployed:
1.  Go to the [AWS App Runner Console](https://console.aws.amazon.com/apprunner/home).
2.  Find the `research-iq-backend` service and copy its **Service URL** (e.g., `https://random-id.us-east-1.awsapprunner.com`).
3.  Update the `research-platform/Dockerfile` or rebuild manually with the URL:
    ```bash
    cd research-platform
    docker build -t research-iq-frontend --build-arg VITE_BACKEND_URL="https://your-backend-url.awsapprunner.com" .
    ```
4.  Push to ECR and create a new App Runner service for the frontend (port 80).

## Infrastructure Overview

-   **Backend**: FastAPI running on AWS App Runner.
-   **Frontend**: React (Vite) + Nginx running on AWS App Runner.
-   **S3**: Used for raw dataset storage.
-   **MLflow**: Local tracking inside the backend container (logs to `mlflow.db`).
-   **Vector DB**: ChromaDB running locally inside the backend container.

## Local Testing
To test the full stack locally before deploying:
```bash
docker-compose up --build
```
Access the app at `http://localhost`.
