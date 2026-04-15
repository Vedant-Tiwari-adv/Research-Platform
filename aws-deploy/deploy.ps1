# Sequential Deployment Script for ResearchIQ
# Usage: ./deploy.ps1

# Configuration
$AppName = "research-iq"
$Region = "us-east-1"
$S3BucketName = "${AppName}-demo-$(Get-Date -Format 'yyyyMMddHHmmss')"
$BackendImageName = "${AppName}-backend"
$FrontendImageName = "${AppName}-frontend"

Write-Host "🚀 Starting Sequential AWS Deployment" -ForegroundColor Cyan

# Check AWS CLI
try {
    $AccountId = (aws sts get-caller-identity --query Account --output text)
    Write-Host "Connected to AWS Account: $AccountId" -ForegroundColor Green
} catch {
    Write-Error "AWS CLI not configured."
    exit
}

# 1. Create S3 Bucket
Write-Host "📦 Creating S3 Bucket: $S3BucketName"
aws s3 mb "s3://$S3BucketName" --region $Region

# 2. Setup ECR Repositories
aws ecr create-repository --repository-name $BackendImageName --region $Region --force-delete $false 2>$null
aws ecr create-repository --repository-name $FrontendImageName --region $Region --force-delete $false 2>$null

# Login to ECR
$LoginPassword = aws ecr get-login-password --region $Region
echo $LoginPassword | docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"

# --- STAGE 1: BACKEND ---
Write-Host "`n--- STAGE 1: BACKEND DEPLOYMENT ---" -ForegroundColor Yellow
Set-Location -Path "backend"
docker build -t "$AccountId.dkr.ecr.$Region.amazonaws.com/$BackendImageName:latest" .
docker push "$AccountId.dkr.ecr.$Region.amazonaws.com/$BackendImageName:latest"
Set-Location -Path ".."

$TrackingUri = if ($Env:MLFLOW_TRACKING_URI) { $Env:MLFLOW_TRACKING_URI } else { "http://placeholder-mlflow:5000" }

$BackendConfig = @{
    ImageRepository = @{
        ImageIdentifier = "$AccountId.dkr.ecr.$Region.amazonaws.com/$BackendImageName:latest"
        ImageConfiguration = @{
            Port = "8000"
            RuntimeEnvironmentVariables = @(
                @{Name = "GEMINI_API_KEY"; Value = "$Env:GEMINI_API_KEY"}
                @{Name = "S3_BUCKET_NAME"; Value = "$S3BucketName"}
                @{Name = "MLFLOW_TRACKING_URI"; Value = "$TrackingUri"}
                @{Name = "JWT_SECRET_KEY"; Value = "research-iq-production-secret-999"}
            )
        }
        ImageRepositoryType = "ECR"
    }
} | ConvertTo-Json -Compress

Write-Host "Creating App Runner Backend Service..."
$AppRunnerSvc = aws apprunner create-service `
    --service-name "$AppName-backend" `
    --source-configuration $BackendConfig `
    --region $Region | ConvertFrom-Json

$ServiceArn = $AppRunnerSvc.Service.ServiceArn
Write-Host "Backend Service ARN: $ServiceArn"

Write-Host "`nIMPORTANT: App Runner is now provisioning the backend." -ForegroundColor Gray
Write-Host "You must wait until the ServiceUrl is assigned in the AWS Console." -ForegroundColor Gray
$BackendUrlRaw = Read-Host "Please enter the Backend ServiceUrl (e.g., xxxxx.us-east-1.awsapprunner.com)"

if (-not $BackendUrlRaw.StartsWith("http")) { $BackendUrl = "https://$BackendUrlRaw" } else { $BackendUrl = $BackendUrlRaw }

# --- STAGE 2: FRONTEND ---
Write-Host "`n--- STAGE 2: FRONTEND DEPLOYMENT ---" -ForegroundColor Yellow
Write-Host "Building frontend with VITE_BACKEND_URL=$BackendUrl"

Set-Location -Path "research-platform"
docker build --build-arg VITE_BACKEND_URL="$BackendUrl" -t "$AccountId.dkr.ecr.$Region.amazonaws.com/$FrontendImageName:latest" .
docker push "$AccountId.dkr.ecr.$Region.amazonaws.com/$FrontendImageName:latest"
Set-Location -Path ".."

$FrontendConfig = @{
    ImageRepository = @{
        ImageIdentifier = "$AccountId.dkr.ecr.$Region.amazonaws.com/$FrontendImageName:latest"
        ImageConfiguration = @{ Port = "80" }
        ImageRepositoryType = "ECR"
    }
} | ConvertTo-Json -Compress

aws apprunner create-service `
    --service-name "$AppName-frontend" `
    --source-configuration $FrontendConfig `
    --region $Region

Write-Host "`n🚀 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "1. Access Backend: $BackendUrl"
Write-Host "2. Access Frontend: (Check App Runner Console for Frontend Url)"
