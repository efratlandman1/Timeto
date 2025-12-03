#!/bin/bash
# =============================================================================
# Google Cloud Platform Setup Script for Timeto Application
# =============================================================================
# This script sets up all required GCP resources for Cloud Run deployment
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Billing enabled on your GCP project
#
# Usage:
#   chmod +x scripts/setup-gcp.sh
#   ./scripts/setup-gcp.sh <PROJECT_ID>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-$(gcloud config get-value project 2>/dev/null)}
REGION="me-west1"  # Tel Aviv
BUCKET_NAME="${PROJECT_ID}-timeto-uploads"
API_SA_NAME="timeto-api-sa"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Timeto - Google Cloud Setup Script${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No project ID provided or configured.${NC}"
    echo "Usage: ./setup-gcp.sh <PROJECT_ID>"
    exit 1
fi

echo -e "${GREEN}Project ID: ${PROJECT_ID}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
echo ""

# =============================================================================
# Step 1: Enable required APIs
# =============================================================================
echo -e "${YELLOW}Step 1: Enabling required APIs...${NC}"

APIs=(
    "run.googleapis.com"
    "cloudbuild.googleapis.com"
    "secretmanager.googleapis.com"
    "storage.googleapis.com"
    "containerregistry.googleapis.com"
    "iam.googleapis.com"
)

for api in "${APIs[@]}"; do
    echo "  Enabling $api..."
    gcloud services enable $api --project=$PROJECT_ID
done

echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# =============================================================================
# Step 2: Create Cloud Storage bucket
# =============================================================================
echo -e "${YELLOW}Step 2: Creating Cloud Storage bucket...${NC}"

if gsutil ls -b gs://$BUCKET_NAME 2>/dev/null; then
    echo "  Bucket $BUCKET_NAME already exists"
else
    gsutil mb -l $REGION -p $PROJECT_ID gs://$BUCKET_NAME
    echo "  Created bucket: $BUCKET_NAME"
fi

# Set bucket permissions for public read (for image serving)
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Enable CORS for the bucket
cat > /tmp/cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Length", "Content-Range"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set /tmp/cors.json gs://$BUCKET_NAME

echo -e "${GREEN}✓ Cloud Storage bucket configured${NC}"
echo ""

# =============================================================================
# Step 3: Create Service Account
# =============================================================================
echo -e "${YELLOW}Step 3: Creating Service Account...${NC}"

SA_EMAIL="${API_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID 2>/dev/null; then
    echo "  Service account already exists"
else
    gcloud iam service-accounts create $API_SA_NAME \
        --display-name="Timeto API Service Account" \
        --project=$PROJECT_ID
    echo "  Created service account: $SA_EMAIL"
fi

# Grant required roles
ROLES=(
    "roles/storage.objectAdmin"
    "roles/secretmanager.secretAccessor"
    "roles/logging.logWriter"
    "roles/cloudtrace.agent"
)

for role in "${ROLES[@]}"; do
    echo "  Granting $role..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$role" \
        --quiet
done

echo -e "${GREEN}✓ Service Account configured${NC}"
echo ""

# =============================================================================
# Step 4: Create Secrets in Secret Manager
# =============================================================================
echo -e "${YELLOW}Step 4: Creating secrets in Secret Manager...${NC}"
echo -e "${YELLOW}  You will need to update these with actual values!${NC}"

SECRETS=(
    "MONGO_URI"
    "JWT_SECRET"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "GOOGLE_MAPS_API_KEY"
    "EMAIL_SERVICE"
    "EMAIL_USER"
    "EMAIL_PASS"
    "SENTRY_DSN"
    "GCS_BUCKET_NAME"
)

for secret in "${SECRETS[@]}"; do
    if gcloud secrets describe $secret --project=$PROJECT_ID 2>/dev/null; then
        echo "  Secret $secret already exists"
    else
        # Create with placeholder value
        echo "PLACEHOLDER_VALUE" | gcloud secrets create $secret \
            --data-file=- \
            --project=$PROJECT_ID \
            --replication-policy="automatic"
        echo "  Created secret: $secret"
    fi
    
    # Grant access to service account
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/secretmanager.secretAccessor" \
        --project=$PROJECT_ID \
        --quiet
done

# Set the bucket name secret to actual value
echo -n "$BUCKET_NAME" | gcloud secrets versions add GCS_BUCKET_NAME \
    --data-file=- \
    --project=$PROJECT_ID

echo -e "${GREEN}✓ Secrets created${NC}"
echo ""

# =============================================================================
# Step 5: Grant Cloud Build permissions
# =============================================================================
echo -e "${YELLOW}Step 5: Configuring Cloud Build permissions...${NC}"

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

BUILD_ROLES=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/storage.admin"
)

for role in "${BUILD_ROLES[@]}"; do
    echo "  Granting $role to Cloud Build..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$CLOUD_BUILD_SA" \
        --role="$role" \
        --quiet
done

echo -e "${GREEN}✓ Cloud Build configured${NC}"
echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Update secrets with actual values:"
echo -e "     ${YELLOW}gcloud secrets versions add MONGO_URI --data-file=- --project=$PROJECT_ID${NC}"
echo -e "     (Then paste your MongoDB URI and press Ctrl+D)"
echo ""
echo -e "  2. Deploy using Cloud Build:"
echo -e "     ${YELLOW}gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID${NC}"
echo ""
echo -e "  3. Or deploy manually:"
echo -e "     ${YELLOW}./scripts/deploy.sh${NC}"
echo ""
echo -e "Resources created:"
echo -e "  - Cloud Storage bucket: ${GREEN}gs://$BUCKET_NAME${NC}"
echo -e "  - Service Account: ${GREEN}$SA_EMAIL${NC}"
echo -e "  - Secrets: ${GREEN}${SECRETS[*]}${NC}"
echo ""

