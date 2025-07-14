# Environment Variable Security Test
# Tests for potential dotenv leakage to client-side

$BaseUrl = "http://localhost:5050"

Write-Host "Testing Environment Variable Security" -ForegroundColor Cyan

# Test 1: Check if server environment variables are exposed via API
Write-Host "`nTest 1: Checking for server env vars in API responses..." -ForegroundColor Yellow

$endpoints = @(
    "/api/v1/businesses",
    "/api/v1/categories", 
    "/api/v1/users",
    "/api/v1/auth"
)

$sensitiveVars = @(
    "MONGO_URL",
    "JWT_SECRET", 
    "EMAIL_PASS",
    "GOOGLE_MAPS_API_KEY",
    "GOOGLE_CLIENT_ID",
    "EMAIL_SERVICE",
    "EMAIL_USER"
)

$foundLeaks = @()

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl$endpoint" -Method GET -ErrorAction Stop
        $responseJson = $response | ConvertTo-Json -Depth 10
        
        foreach ($var in $sensitiveVars) {
            if ($responseJson -like "*$var*") {
                $foundLeaks += "Found $var in $endpoint"
            }
        }
    } catch {
        Write-Host "   Skipping $endpoint (requires auth or not available)" -ForegroundColor Gray
    }
}

if ($foundLeaks.Count -gt 0) {
    Write-Host "   CRITICAL: Found environment variable leaks:" -ForegroundColor Red
    foreach ($leak in $foundLeaks) {
        Write-Host "   - $leak" -ForegroundColor Red
    }
} else {
    Write-Host "   SUCCESS: No environment variables found in API responses" -ForegroundColor Green
}

# Test 2: Check client-side build for environment variables
Write-Host "`nTest 2: Checking client build directory..." -ForegroundColor Yellow

$clientBuildPath = "client\build"
if (Test-Path $clientBuildPath) {
    $jsFiles = Get-ChildItem -Path $clientBuildPath -Filter "*.js" -Recurse
    
    $clientLeaks = @()
    foreach ($file in $jsFiles) {
        $content = Get-Content $file.FullName -Raw
        foreach ($var in $sensitiveVars) {
            if ($content -like "*$var*") {
                $clientLeaks += "Found $var in $($file.Name)"
            }
        }
    }
    
    if ($clientLeaks.Count -gt 0) {
        Write-Host "   CRITICAL: Found environment variables in client build:" -ForegroundColor Red
        foreach ($leak in $clientLeaks) {
            Write-Host "   - $leak" -ForegroundColor Red
        }
    } else {
        Write-Host "   SUCCESS: No sensitive environment variables in client build" -ForegroundColor Green
    }
} else {
    Write-Host "   INFO: Client build directory not found (run 'npm run build' first)" -ForegroundColor Yellow
}

# Test 3: Check for React environment variables (should only be REACT_APP_*)
Write-Host "`nTest 3: Checking React environment variables..." -ForegroundColor Yellow

$reactEnvVars = @(
    "REACT_APP_API_DOMAIN",
    "REACT_APP_GOOGLE_CLIENT_ID", 
    "REACT_APP_GOOGLE_MAPS_API_KEY"
)

$clientSrcFiles = Get-ChildItem -Path "client\src" -Filter "*.js" -Recurse
$clientJsxFiles = Get-ChildItem -Path "client\src" -Filter "*.jsx" -Recurse
$allClientFiles = $clientSrcFiles + $clientJsxFiles

$reactEnvUsage = @()
foreach ($file in $allClientFiles) {
    $content = Get-Content $file.FullName -Raw
    foreach ($var in $reactEnvVars) {
        if ($content -like "*$var*") {
            $reactEnvUsage += "$var used in $($file.Name)"
        }
    }
}

if ($reactEnvUsage.Count -gt 0) {
    Write-Host "   INFO: React environment variables found in client code:" -ForegroundColor Green
    foreach ($usage in $reactEnvUsage) {
        Write-Host "   - $usage" -ForegroundColor Green
    }
} else {
    Write-Host "   WARNING: No React environment variables found in client code" -ForegroundColor Yellow
}

Write-Host "`nEnvironment Security Test Summary:" -ForegroundColor Cyan
Write-Host "✅ Server env vars should NOT be exposed via API" -ForegroundColor Green
Write-Host "✅ Sensitive vars should NOT be in client build" -ForegroundColor Green  
Write-Host "✅ Only REACT_APP_* vars should be in client code" -ForegroundColor Green 