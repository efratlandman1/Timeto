#!/bin/bash
# =============================================================================
# Docker Entrypoint for Cloud Run React App
# =============================================================================
# Injects runtime environment variables into the React build

set -e

# Create runtime config file with environment variables
# This allows runtime configuration without rebuilding the image
cat > /usr/share/nginx/html/config.js << EOF
window.RUNTIME_CONFIG = {
  REACT_APP_API_URL: "${REACT_APP_API_URL:-}",
  REACT_APP_GOOGLE_CLIENT_ID: "${REACT_APP_GOOGLE_CLIENT_ID:-}",
  REACT_APP_GOOGLE_MAPS_API_KEY: "${REACT_APP_GOOGLE_MAPS_API_KEY:-}"
};
EOF

echo "Runtime config injected:"
cat /usr/share/nginx/html/config.js

# Replace PORT placeholder in nginx config if needed
# Cloud Run always provides PORT env var
if [ -n "$PORT" ]; then
    sed -i "s/listen 8080/listen $PORT/" /etc/nginx/nginx.conf
    echo "Nginx configured to listen on port $PORT"
fi

# Execute the main command (nginx)
exec "$@"

