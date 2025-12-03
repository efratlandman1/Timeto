#!/bin/bash
# =============================================================================
# Manual Deployment Script for Cloud Run
# =============================================================================
# Use this script for manual deployments. For CI/CD, use cloudbuild.yaml
#
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh [api|client|all]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}
REGION="me-west1"
API_SERVICE="timeto-api"
CLIENT_SERVICE="timeto-client"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Timeto - Cloud Run Deployment${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project configured.${NC}"
    echo "Set GCP_PROJECT_ID or run: gcloud config set project <PROJECT_ID>"
    exit 1
fi

echo -e "Project: ${GREEN}$PROJECT_ID${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo ""

DEPLOY_TARGET=${1:-all}

# =============================================================================
# Deploy API
# =============================================================================
deploy_api() {
    echo -e "${YELLOW}Building and deploying API...${NC}"
    
    # Build Docker image
    echo "  Building Docker image..."
    docker build \
        -t gcr.io/$PROJECT_ID/$API_SERVICE:$TIMESTAMP \
        -t gcr.io/$PROJECT_ID/$API_SERVICE:latest \
        -f server/Dockerfile.cloudrun \
        ./server
    
    # Push to Container Registry
    echo "  Pushing to Container Registry..."
    docker push gcr.io/$PROJECT_ID/$API_SERVICE:$TIMESTAMP
    docker push gcr.io/$PROJECT_ID/$API_SERVICE:latest
    
    # Deploy to Cloud Run
    echo "  Deploying to Cloud Run..."
    gcloud run deploy $API_SERVICE \
        --image gcr.io/$PROJECT_ID/$API_SERVICE:$TIMESTAMP \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --port 8080 \
        --service-account timeto-api-sa@$PROJECT_ID.iam.gserviceaccount.com \
        --set-env-vars "NODE_ENV=prod" \
        --set-secrets "MONGO_URI=MONGO_URI:latest,JWT_SECRET=JWT_SECRET:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest,EMAIL_SERVICE=EMAIL_SERVICE:latest,EMAIL_USER=EMAIL_USER:latest,EMAIL_PASS=EMAIL_PASS:latest,SENTRY_DSN=SENTRY_DSN:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest"
    
    # Get service URL
    API_URL=$(gcloud run services describe $API_SERVICE --region=$REGION --format='value(status.url)')
    echo -e "${GREEN}✓ API deployed: $API_URL${NC}"
    echo ""
}

# =============================================================================
# Deploy Client
# =============================================================================
deploy_client() {
    echo -e "${YELLOW}Building and deploying Client...${NC}"
    
    # Get API URL
    API_URL=$(gcloud run services describe $API_SERVICE --region=$REGION --format='value(status.url)' 2>/dev/null || echo "")
    
    if [ -z "$API_URL" ]; then
        echo -e "${RED}Warning: API service not found. Client may not work correctly.${NC}"
        API_URL="https://$API_SERVICE-placeholder.run.app"
    fi
    
    # Build Docker image with API URL
    echo "  Building Docker image..."
    docker build \
        -t gcr.io/$PROJECT_ID/$CLIENT_SERVICE:$TIMESTAMP \
        -t gcr.io/$PROJECT_ID/$CLIENT_SERVICE:latest \
        -f client/Dockerfile.cloudrun \
        --build-arg REACT_APP_API_URL=$API_URL \
        ./client
    
    # Push to Container Registry
    echo "  Pushing to Container Registry..."
    docker push gcr.io/$PROJECT_ID/$CLIENT_SERVICE:$TIMESTAMP
    docker push gcr.io/$PROJECT_ID/$CLIENT_SERVICE:latest
    
    # Deploy to Cloud Run
    echo "  Deploying to Cloud Run..."
    gcloud run deploy $CLIENT_SERVICE \
        --image gcr.io/$PROJECT_ID/$CLIENT_SERVICE:$TIMESTAMP \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --memory 256Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --port 8080 \
        --set-env-vars "REACT_APP_API_URL=$API_URL" \
        --set-secrets "REACT_APP_GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,REACT_APP_GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest"
    
    # Get service URL
    CLIENT_URL=$(gcloud run services describe $CLIENT_SERVICE --region=$REGION --format='value(status.url)')
    echo -e "${GREEN}✓ Client deployed: $CLIENT_URL${NC}"
    echo ""
}

# =============================================================================
# Main
# =============================================================================
case $DEPLOY_TARGET in
    api)
        deploy_api
        ;;
    client)
        deploy_client
        ;;
    all)
        deploy_api
        deploy_client
        ;;
    *)
        echo "Usage: $0 [api|client|all]"
        exit 1
        ;;
esac

echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo "Service URLs:"
gcloud run services list --region=$REGION --format='table(SERVICE,URL)'
echo ""

