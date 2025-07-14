# Quick Request Size Test
# Simple test to verify size limits are working

$BaseUrl = "http://localhost:5050"

Write-Host "Testing Request Size Limits" -ForegroundColor Cyan

# Test 1: Normal request (should work)
Write-Host "`nTest 1: Normal request..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/businesses" -Method GET
    Write-Host "   SUCCESS: Normal request works" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: Normal request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Oversized JSON (should fail with 413)
Write-Host "`nTest 2: Oversized request..." -ForegroundColor Yellow
try {
    $largeData = "x" * (11 * 1024 * 1024) # 11MB
    $oversizedBody = @{ description = $largeData } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/businesses" -Method POST -Body $oversizedBody -ContentType "application/json"
    Write-Host "   FAILED: Oversized request should have failed!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 413) {
        Write-Host "   SUCCESS: Oversized request correctly rejected (413)" -ForegroundColor Green
    } else {
        Write-Host "   FAILED: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Malformed JSON (should fail with 400)
Write-Host "`nTest 3: Malformed JSON..." -ForegroundColor Yellow
try {
    $malformedBody = '{"name": "Test", "invalid":}'
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/businesses" -Method POST -Body $malformedBody -ContentType "application/json"
    Write-Host "   FAILED: Malformed JSON should have failed!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "   SUCCESS: Malformed JSON correctly rejected (400)" -ForegroundColor Green
    } else {
        Write-Host "   FAILED: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nTest completed!" -ForegroundColor Cyan 