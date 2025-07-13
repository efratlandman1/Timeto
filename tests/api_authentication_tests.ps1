# PowerShell Script for API Testing
# Run this script to test all API endpoints

$baseUrl = "http://localhost:5050/api/v1"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODQ5ZDkwMWQ0ODEwZjdkMDQ5NWY4OTMiLCJlbWFpbCI6Im1lNDU1Mjk5bmlAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZmlyc3ROYW1lIjoiTWVuaSIsImxhc3ROYW1lIjoiTGFuZG1hbiIsImlhdCI6MTc1MjE3MTUwMiwiZXhwIjoxNzUyMTc1MTAyfQ.4rT20vIV069TJZJTnbJQdNGDu13HVgGvKqQLagThpVY"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== API Endpoints Testing ===" -ForegroundColor Green
Write-Host ""

# ========================================
# 1. Public tests (publicRoute)
# ========================================
Write-Host "1. Public tests (publicRoute):" -ForegroundColor Yellow

try {
    Write-Host "   Testing categories..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Method GET
    Write-Host "   [OK] Categories - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Categories - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing services..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method GET
    Write-Host "   [OK] Services - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Services - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing stats..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/stats/home" -Method GET
    Write-Host "   [OK] Stats - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Stats - failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========================================
# 2. Optional auth tests (optionalAuth)
# ========================================
Write-Host "2. Optional auth tests (optionalAuth):" -ForegroundColor Yellow

try {
    Write-Host "   Testing businesses (no token)..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/businesses" -Method GET
    Write-Host "   [OK] Businesses without token - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Businesses without token - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing businesses (with token)..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/businesses" -Method GET -Headers $headers
    Write-Host "   [OK] Businesses with token - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Businesses with token - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing all businesses..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/businesses/all" -Method GET -Headers $headers
    Write-Host "   [OK] All businesses - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] All businesses - failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========================================
# 3. Required auth tests (requireAuth)
# ========================================
Write-Host "3. Required auth tests (requireAuth):" -ForegroundColor Yellow

try {
    Write-Host "   Testing my businesses..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/businesses/user-businesses" -Method GET -Headers $headers
    Write-Host "   [OK] My businesses - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] My businesses - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing my favorites..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/favorites/user-favorites" -Method GET -Headers $headers
    Write-Host "   [OK] My favorites - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] My favorites - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing my suggestions..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/suggestions/my-suggestions" -Method GET -Headers $headers
    Write-Host "   [OK] My suggestions - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] My suggestions - failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========================================
# 4. Admin tests (requireAdmin)
# ========================================
Write-Host "4. Admin tests (requireAdmin):" -ForegroundColor Yellow

try {
    Write-Host "   Testing all users..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET -Headers $headers
    Write-Host "   [OK] All users - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] All users - failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "   Testing all suggestions..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/suggestions" -Method GET -Headers $headers
    Write-Host "   [OK] All suggestions - working" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] All suggestions - failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ========================================
# 5. Security tests - without token (should return 401)
# ========================================
Write-Host "5. Security tests - without token (should return 401):" -ForegroundColor Yellow

try {
    Write-Host "   Testing my businesses (no token)..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/businesses/user-businesses" -Method GET
    Write-Host "   [FAIL] My businesses without token - passed (should not pass)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   [OK] My businesses without token - returned 401 (correct)" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] My businesses without token - other error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

try {
    Write-Host "   Testing my favorites (no token)..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/favorites/user-favorites" -Method GET
    Write-Host "   [FAIL] My favorites without token - passed (should not pass)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   [OK] My favorites without token - returned 401 (correct)" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] My favorites without token - other error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Testing Complete ===" -ForegroundColor Green 