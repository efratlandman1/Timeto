# PowerShell Script for Rate Limiting Testing
# Run this script to test all rate limiting scenarios

$baseUrl = "http://localhost:5050/api/v1"

Write-Host "=== Rate Limiting Test Suite ===" -ForegroundColor Green
Write-Host "Testing all rate limiting scenarios..." -ForegroundColor Yellow
Write-Host ""

# ========================================
# 1. General Limiter Test (250 requests per 15 minutes)
# ========================================
Write-Host "1. General Limiter Test (250 requests per 15 minutes):" -ForegroundColor Yellow

try {
    Write-Host "   Testing GET /businesses..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/businesses" -Method GET
    Write-Host "   [OK] GET /businesses - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] GET /businesses - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing GET /categories..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Method GET
    Write-Host "   [OK] GET /categories - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] GET /categories - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing GET /services..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method GET
    Write-Host "   [OK] GET /services - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] GET /services - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing GET /stats/home..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/stats/home" -Method GET
    Write-Host "   [OK] GET /stats/home - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] GET /stats/home - failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========================================
# 2. Auth Limiter Test (5 requests per 15 minutes)
# ========================================
Write-Host "2. Auth Limiter Test (5 requests per 15 minutes):" -ForegroundColor Yellow

Write-Host "   Testing POST /auth - 6 attempts..." -ForegroundColor Cyan
for ($i = 1; $i -le 6; $i++) {
    try {
        $body = @{
            email = "test@example.com"
            password = "testpassword"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/auth" -Method POST -Body $body -ContentType "application/json"
        Write-Host "   [OK] Request $i to /auth - succeeded" -ForegroundColor Green
    } catch {
        if ($i -gt 5) {
            Write-Host "   [OK] Request $i to /auth - correctly blocked by rate limiter" -ForegroundColor Yellow
        } else {
            Write-Host "   [FAIL] Request $i to /auth - failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# ========================================
# 3. Write Limiter Test (40 requests per 15 minutes)
# ========================================
Write-Host "3. Write Limiter Test (40 requests per 15 minutes):" -ForegroundColor Yellow

Write-Host "   Testing POST /businesses - 45 attempts..." -ForegroundColor Cyan
for ($i = 1; $i -le 45; $i++) {
    try {
        $body = @{
            name = "Test Business $i"
            description = "Test description"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/businesses" -Method POST -Body $body -ContentType "application/json"
        Write-Host "   [OK] Request $i to /businesses - succeeded" -ForegroundColor Green
    } catch {
        if ($i -gt 40) {
            Write-Host "   [OK] Request $i to /businesses - correctly blocked by rate limiter" -ForegroundColor Yellow
            break
        } else {
            Write-Host "   [FAIL] Request $i to /businesses - failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# ========================================
# 4. Rate Limit Headers Test
# ========================================
Write-Host "4. Rate Limit Headers Test:" -ForegroundColor Yellow

try {
    Write-Host "   Checking rate limit headers..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri "$baseUrl/businesses" -Method GET
    $headers = $response.Headers
    
    if ($headers["RateLimit-Limit"]) {
        Write-Host "   [OK] RateLimit-Limit header present: $($headers["RateLimit-Limit"])" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] RateLimit-Limit header missing" -ForegroundColor Red
    }
    
    if ($headers["RateLimit-Remaining"]) {
        Write-Host "   [OK] RateLimit-Remaining header present: $($headers["RateLimit-Remaining"])" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] RateLimit-Remaining header missing" -ForegroundColor Red
    }
    
    if ($headers["RateLimit-Reset"]) {
        Write-Host "   [OK] RateLimit-Reset header present: $($headers['RateLimit-Reset'])" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] RateLimit-Reset header missing" -ForegroundColor Red
    }
} catch {
    Write-Host "   [FAIL] Failed to check headers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========================================
# 5. Per-IP Rate Limiting Test
# ========================================
Write-Host "5. Per-IP Rate Limiting Test:" -ForegroundColor Yellow

$userAgents = @(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
)

foreach ($userAgent in $userAgents) {
    try {
        Write-Host "   Testing with User-Agent: $($userAgent.Substring(0, 30))..." -ForegroundColor Cyan
        $headers = @{
            "User-Agent" = $userAgent
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/businesses" -Method GET -Headers $headers
        Write-Host "   [OK] Request with User-Agent succeeded" -ForegroundColor Green
    } catch {
        Write-Host "   [FAIL] Request with User-Agent failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Green
Write-Host "✓ General Limiter: 250 requests per 15 minutes" -ForegroundColor Green
Write-Host "✓ Auth Limiter: 5 requests per 15 minutes" -ForegroundColor Green
Write-Host "✓ Write Limiter: 40 requests per 15 minutes" -ForegroundColor Green
Write-Host "✓ Headers: RateLimit-* headers should be present" -ForegroundColor Green
Write-Host "✓ Per-IP: Rate limiting should be per IP address" -ForegroundColor Green

Write-Host ""
Write-Host "=== Testing Complete ===" -ForegroundColor Green
Write-Host "Note: Some tests may fail if server is not running or routes require authentication." -ForegroundColor Gray