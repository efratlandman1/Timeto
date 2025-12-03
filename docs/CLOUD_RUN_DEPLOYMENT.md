# 🚀 Timeto - Cloud Run Deployment Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Initial Setup](#initial-setup)
5. [Deployment Methods](#deployment-methods)
6. [Secret Management](#secret-management)
7. [Custom Domain Setup](#custom-domain-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Cost Optimization](#cost-optimization)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This guide covers deploying the Timeto business directory application to Google Cloud Run.

### Services Deployed

| Service | Description | Resources |
|---------|-------------|-----------|
| `timeto-api` | Node.js/Express API | 512Mi RAM, 1 CPU |
| `timeto-client` | React frontend (Nginx) | 256Mi RAM, 1 CPU |

### Key Features
- ✅ Auto-scaling from 0 to 10 instances
- ✅ Pay-per-request pricing
- ✅ Automatic HTTPS
- ✅ Cloud Storage for file uploads
- ✅ Cloud Logging for centralized logs
- ✅ Secret Manager for sensitive configuration

---

## 📋 Prerequisites

### Required Tools

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Install Docker
# macOS: brew install docker
# Ubuntu: sudo apt install docker.io

# Verify installations
gcloud --version
docker --version
```

### GCP Requirements

- Google Cloud account with billing enabled
- Project created with billing linked
- Owner or Editor role on the project

### Authentication

```bash
# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Configure Docker for GCR
gcloud auth configure-docker
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Google Cloud Platform                        │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │   Cloud      │                                                   │
│  │   Load       │◀──── Users                                        │
│  │   Balancer   │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                            │
│    ┌────┴────┐                                                      │
│    ▼         ▼                                                      │
│  ┌────────────────┐    ┌────────────────┐                          │
│  │  Cloud Run     │    │  Cloud Run     │                          │
│  │  timeto-client │    │  timeto-api    │                          │
│  │  (React+Nginx) │───▶│  (Node.js)     │                          │
│  └────────────────┘    └───────┬────────┘                          │
│                                │                                    │
│         ┌──────────────────────┼──────────────────────┐            │
│         ▼                      ▼                      ▼            │
│  ┌─────────────┐    ┌─────────────────┐    ┌────────────────┐     │
│  │   Cloud     │    │     Secret      │    │    Cloud       │     │
│  │   Storage   │    │     Manager     │    │    Logging     │     │
│  │   (Files)   │    │   (Secrets)     │    │    (Logs)      │     │
│  └─────────────┘    └─────────────────┘    └────────────────┘     │
│                                                                      │
│                        ┌─────────────────┐                          │
│                        │  MongoDB Atlas  │ (External)                │
│                        │   (Database)    │                          │
│                        └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Initial Setup

### Step 1: Run Setup Script

```bash
# Make script executable
chmod +x scripts/setup-gcp.sh

# Run setup (creates all GCP resources)
./scripts/setup-gcp.sh YOUR_PROJECT_ID
```

This script creates:
- Cloud Storage bucket for uploads
- Service Account with proper permissions
- Secrets in Secret Manager
- Enables required APIs

### Step 2: Configure Secrets

Update each secret with actual values:

```bash
# MongoDB connection string
echo -n "mongodb+srv://user:pass@cluster.mongodb.net/timeto" | \
  gcloud secrets versions add MONGO_URI --data-file=-

# JWT Secret (generate a secure random string)
openssl rand -base64 64 | \
  gcloud secrets versions add JWT_SECRET --data-file=-

# Google OAuth Client ID
echo -n "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" | \
  gcloud secrets versions add GOOGLE_CLIENT_ID --data-file=-

# Google OAuth Client Secret
echo -n "YOUR_GOOGLE_CLIENT_SECRET" | \
  gcloud secrets versions add GOOGLE_CLIENT_SECRET --data-file=-

# Google Maps API Key
echo -n "YOUR_GOOGLE_MAPS_API_KEY" | \
  gcloud secrets versions add GOOGLE_MAPS_API_KEY --data-file=-

# Email configuration
echo -n "gmail" | gcloud secrets versions add EMAIL_SERVICE --data-file=-
echo -n "your-email@gmail.com" | gcloud secrets versions add EMAIL_USER --data-file=-
echo -n "your-app-password" | gcloud secrets versions add EMAIL_PASS --data-file=-

# Sentry DSN (optional)
echo -n "https://xxx@sentry.io/xxx" | \
  gcloud secrets versions add SENTRY_DSN --data-file=-
```

### Step 3: Set Up MongoDB Atlas

1. Create a MongoDB Atlas cluster (M0 free tier for testing, M10+ for production)
2. Whitelist Cloud Run IPs (or use 0.0.0.0/0 for simplicity)
3. Create database user
4. Get connection string and add to MONGO_URI secret

---

## 📦 Deployment Methods

### Method 1: Automated CI/CD (Recommended)

Use Cloud Build with the provided `cloudbuild.yaml`:

```bash
# Trigger build manually
gcloud builds submit --config cloudbuild.yaml

# Or set up a trigger for automatic deployment
gcloud builds triggers create github \
  --repo-name=Timeto \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

### Method 2: Manual Deployment

Use the deployment script:

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy both services
./scripts/deploy.sh all

# Or deploy individually
./scripts/deploy.sh api
./scripts/deploy.sh client
```

### Method 3: Direct gcloud Commands

```bash
# Build and push API
docker build -t gcr.io/YOUR_PROJECT/timeto-api -f server/Dockerfile.cloudrun ./server
docker push gcr.io/YOUR_PROJECT/timeto-api

# Deploy API
gcloud run deploy timeto-api \
  --image gcr.io/YOUR_PROJECT/timeto-api \
  --region me-west1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-secrets "MONGO_URI=MONGO_URI:latest,JWT_SECRET=JWT_SECRET:latest"

# Build and push Client
docker build -t gcr.io/YOUR_PROJECT/timeto-client -f client/Dockerfile.cloudrun ./client
docker push gcr.io/YOUR_PROJECT/timeto-client

# Deploy Client
gcloud run deploy timeto-client \
  --image gcr.io/YOUR_PROJECT/timeto-client \
  --region me-west1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi
```

---

## 🔐 Secret Management

### Viewing Secrets

```bash
# List all secrets
gcloud secrets list

# View secret versions
gcloud secrets versions list MONGO_URI

# Access a secret value
gcloud secrets versions access latest --secret=MONGO_URI
```

### Updating Secrets

```bash
# Add new version (old version remains accessible)
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Disable old version
gcloud secrets versions disable VERSION_ID --secret=SECRET_NAME
```

### Rotating Secrets

1. Add new secret version
2. Redeploy services to pick up new value
3. Disable old secret version
4. After confirming everything works, destroy old version

---

## 🌐 Custom Domain Setup

### Step 1: Map Custom Domain

```bash
# Map domain to client service
gcloud run domain-mappings create \
  --service timeto-client \
  --domain app.yourdomain.com \
  --region me-west1

# Map domain to API service
gcloud run domain-mappings create \
  --service timeto-api \
  --domain api.yourdomain.com \
  --region me-west1
```

### Step 2: Configure DNS

Add the following DNS records:

| Type | Name | Value |
|------|------|-------|
| CNAME | app | ghs.googlehosted.com |
| CNAME | api | ghs.googlehosted.com |

### Step 3: Update CORS

Update `CLIENT_URL` and `SERVER_URL` in your secrets to match custom domains.

---

## 📊 Monitoring & Logging

### View Logs

```bash
# API logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=timeto-api" --limit 50

# Client logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=timeto-client" --limit 50

# Error logs only
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 20
```

### Cloud Console

- **Logs**: https://console.cloud.google.com/logs
- **Cloud Run**: https://console.cloud.google.com/run
- **Monitoring**: https://console.cloud.google.com/monitoring

### Create Alerts

```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Error Rate - Timeto API" \
  --condition-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="timeto-api"' \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

---

## 💰 Cost Optimization

### Current Configuration (Optimized)

| Setting | Value | Reason |
|---------|-------|--------|
| `min-instances` | 0 | Scale to zero when idle |
| `max-instances` | 10 | Prevent runaway costs |
| `cpu-throttling` | true | Only charge for request time |
| Memory | 256-512Mi | Minimal but sufficient |

### Cost Monitoring

```bash
# View current month costs
gcloud billing budgets describe YOUR_BUDGET_ID

# Set up budget alert
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Timeto Monthly Budget" \
  --budget-amount=100USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

### Tips to Reduce Costs

1. **Use minimum instances = 0** for non-critical services
2. **Enable CPU throttling** to pay only for request time
3. **Set up budget alerts** to catch unexpected spikes
4. **Review Cloud Storage usage** regularly
5. **Use Cloud CDN** for static assets (reduces origin requests)

---

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check logs
gcloud run services logs read timeto-api --region me-west1

# Check if secrets are accessible
gcloud run services describe timeto-api --region me-west1

# Verify secret exists
gcloud secrets versions access latest --secret=MONGO_URI
```

#### Database Connection Failed

1. Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0 (or Cloud NAT IP)
2. Check connection string format
3. Verify database user credentials

#### Cold Start Issues

```bash
# Set minimum instances to 1 (increases cost)
gcloud run services update timeto-api \
  --min-instances 1 \
  --region me-west1
```

#### File Upload Issues

```bash
# Verify bucket exists and is accessible
gsutil ls gs://YOUR_PROJECT-timeto-uploads

# Check bucket permissions
gsutil iam get gs://YOUR_PROJECT-timeto-uploads

# Test upload manually
echo "test" | gsutil cp - gs://YOUR_PROJECT-timeto-uploads/test.txt
```

### Rollback Deployment

```bash
# List revisions
gcloud run revisions list --service timeto-api --region me-west1

# Rollback to previous revision
gcloud run services update-traffic timeto-api \
  --to-revisions REVISION_NAME=100 \
  --region me-west1
```

### Get Support Logs

```bash
# Export logs for support
gcloud logging read \
  "resource.type=cloud_run_revision AND timestamp>=\"$(date -d '1 hour ago' -Iseconds)\"" \
  --format=json > support-logs.json
```

---

## 📁 Files Created for Cloud Run

```
Timeto/
├── cloudbuild.yaml                    # CI/CD configuration
├── cloudrun/
│   ├── api-service.yaml              # API service definition
│   └── client-service.yaml           # Client service definition
├── docs/
│   └── CLOUD_RUN_DEPLOYMENT.md       # This documentation
├── scripts/
│   ├── setup-gcp.sh                  # GCP setup script
│   └── deploy.sh                     # Manual deployment script
├── server/
│   ├── Dockerfile.cloudrun           # API production Dockerfile
│   ├── logger.cloudrun.js            # Cloud Logging compatible logger
│   └── config/
│       ├── cloudStorage.js           # GCS file upload handler
│       └── multerCloudStorage.js     # Multer with GCS support
└── client/
    ├── Dockerfile.cloudrun           # Client production Dockerfile
    ├── nginx.cloudrun.conf           # Nginx config for Cloud Run
    └── docker-entrypoint.sh          # Runtime config injection
```

---

## ✅ Deployment Checklist

- [ ] GCP project created and billing enabled
- [ ] `setup-gcp.sh` script executed successfully
- [ ] All secrets configured with real values
- [ ] MongoDB Atlas cluster created and configured
- [ ] API deployed and health check passing
- [ ] Client deployed and loading correctly
- [ ] File uploads working (test image upload)
- [ ] Authentication working (Google OAuth)
- [ ] Logs appearing in Cloud Logging
- [ ] Custom domains configured (optional)
- [ ] Budget alerts set up
- [ ] Sentry error tracking configured (optional)

---

## 🆘 Getting Help

- **Google Cloud Documentation**: https://cloud.google.com/run/docs
- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com
- **Stack Overflow**: Tag questions with `google-cloud-run`
- **Google Cloud Support**: https://cloud.google.com/support

---

*Last updated: December 2024*

