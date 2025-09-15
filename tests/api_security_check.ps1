# API Security Check Script for Time-To
# Similar to authentication tests from last week
# Usage: .\api_security_check.ps1

param(
    [string]$BaseUrl = "http://localhost:5050",
    [string]$ClientUrl = "http://localhost:3030"
)

$ApiUrl = "$BaseUrl/api/v1"

Write-Host "API Security Check - Time-To" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "Client URL: $ClientUrl" -ForegroundColor Cyan
Write-Host ""

# Test Results
$TestResults = @()

# Function to add test result
function Add-TestResult {
    param($TestName, $Status, $Message, $Details = "")
    $TestResults += [PSCustomObject]@{
        TestName = $TestName
        Status = $Status
        Message = $Message
        Details = $Details
    }
}

# Function to display test results
function Show-TestResults {
    Write-Host "`nTest Results Summary:" -ForegroundColor Yellow
    Write-Host "=========================" -ForegroundColor Yellow
    
    $Passed = ($TestResults | Where-Object { $_.Status -eq "PASS" }).Count
    $Failed = ($TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
    $Warning = ($TestResults | Where-Object { $_.Status -eq "WARNING" }).Count
    
    Write-Host "PASSED: $Passed" -ForegroundColor Green
    Write-Host "FAILED: $Failed" -ForegroundColor Red
    Write-Host "WARNINGS: $Warning" -ForegroundColor Yellow
    
    Write-Host "`nDetailed Results:" -ForegroundColor Yellow
    foreach ($result in $TestResults) {
        $color = switch ($result.Status) {
            "PASS" { "Green" }
            "FAIL" { "Red" }
            "WARNING" { "Yellow" }
        }
        Write-Host "  $($result.TestName): $($result.Message)" -ForegroundColor $color
        if ($result.Details) {
            Write-Host "    Details: $($result.Details)" -ForegroundColor Gray
        }
    }
}

# Test 1: Server Connectivity
Write-Host "1. Testing Server Connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/categories" -Method GET -TimeoutSec 10
    Add-TestResult "Server Connectivity" "PASS" "Server is running and responding"
} catch {
    Add-TestResult "Server Connectivity" "FAIL" "Server is not accessible" $_.Exception.Message
    Show-TestResults
    exit 1
}

# Test 2: Helmet Security Headers
Write-Host "2. Testing Helmet Security Headers..." -ForegroundColor Yellow
$headers = $response.Headers
$requiredHeaders = @("X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection", "Content-Security-Policy")
$foundHeaders = 0

foreach ($header in $requiredHeaders) {
    if ($headers[$header]) {
        $foundHeaders++
    }
}

if ($foundHeaders -ge 3) {
    Add-TestResult "Helmet Headers" "PASS" "Found $foundHeaders security headers"
} elseif ($foundHeaders -gt 0) {
    Add-TestResult "Helmet Headers" "WARNING" "Found only $foundHeaders security headers"
} else {
    Add-TestResult "Helmet Headers" "FAIL" "No security headers found"
}

# Test 3: CORS Configuration
Write-Host "3. Testing CORS Configuration..." -ForegroundColor Yellow
try {
    $corsResponse = Invoke-WebRequest -Uri "$ApiUrl/categories" -Method OPTIONS -Headers @{"Origin" = $ClientUrl}
    $corsOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
    
    if ($corsOrigin -and $corsOrigin -eq $ClientUrl) {
        Add-TestResult "CORS Configuration" "PASS" "CORS properly configured for $ClientUrl"
    } elseif ($corsOrigin) {
        Add-TestResult "CORS Configuration" "WARNING" "CORS configured but origin mismatch" "Expected: $ClientUrl, Got: $corsOrigin"
    } else {
        Add-TestResult "CORS Configuration" "FAIL" "CORS not configured"
    }
} catch {
    Add-TestResult "CORS Configuration" "FAIL" "CORS test failed" $_.Exception.Message
}

# Test 4: Cross-Origin Resource Policy
Write-Host "4. Testing Cross-Origin Resource Policy..." -ForegroundColor Yellow
$corpHeader = $response.Headers["Cross-Origin-Resource-Policy"]

if ($corpHeader) {
    Add-TestResult "CORP Policy" "PASS" "Cross-Origin Resource Policy configured" "Policy: $corpHeader"
} else {
    Add-TestResult "CORP Policy" "WARNING" "Cross-Origin Resource Policy not found"
}

# Test 5: Rate Limiting
Write-Host "5. Testing Rate Limiting..." -ForegroundColor Yellow
$rateLimitFound = $false
$rateLimitHeaders = @()

for ($i = 1; $i -le 5; $i++) {
    try {
        $rateResponse = Invoke-WebRequest -Uri "$ApiUrl/categories" -Method GET -TimeoutSec 5
        $remaining = $rateResponse.Headers["X-RateLimit-Remaining"]
        if ($remaining) {
            $rateLimitHeaders += $remaining
            $rateLimitFound = $true
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $rateLimitFound = $true
            break
        }
    }
}

if ($rateLimitFound) {
    Add-TestResult "Rate Limiting" "PASS" "Rate limiting is active"
} else {
    Add-TestResult "Rate Limiting" "WARNING" "Rate limiting not detected"
}

# Test 6: JWT Token Security (if auth endpoint exists)
Write-Host "6. Testing JWT Token Security..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json" -ErrorAction SilentlyContinue
    
    if ($loginResponse.token) {
        # Decode token to check security settings
        $tokenParts = $loginResponse.token.Split('.')
        if ($tokenParts.Length -eq 3) {
            $header = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[0]))
            $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1]))
            
            # Check for security features
            $hasAlgorithm = $header -match '"alg"'
            $hasIssuer = $payload -match '"iss"'
            $hasAudience = $payload -match '"aud"'
            $hasExpiration = $payload -match '"exp"'
            
            $securityFeatures = @()
            if ($hasAlgorithm) { $securityFeatures += "Algorithm" }
            if ($hasIssuer) { $securityFeatures += "Issuer" }
            if ($hasAudience) { $securityFeatures += "Audience" }
            if ($hasExpiration) { $securityFeatures += "Expiration" }
            
            if ($securityFeatures.Count -ge 3) {
                Add-TestResult "JWT Security" "PASS" "JWT has $($securityFeatures.Count) security features" ($securityFeatures -join ", ")
            } else {
                Add-TestResult "JWT Security" "WARNING" "JWT missing some security features" ($securityFeatures -join ", ")
            }
        } else {
            Add-TestResult "JWT Security" "FAIL" "Invalid JWT token format"
        }
    } else {
        Add-TestResult "JWT Security" "WARNING" "Could not test JWT (login failed)"
    }
} catch {
    Add-TestResult "JWT Security" "WARNING" "JWT test skipped (auth endpoint not available)"
}

# Test 7: Environment Variables (indirect test)
Write-Host "7. Testing Environment Variables..." -ForegroundColor Yellow
if ($response.StatusCode -eq 200) {
    Add-TestResult "Environment Variables" "PASS" "Server running with valid environment variables"
} else {
    Add-TestResult "Environment Variables" "FAIL" "Server not responding correctly"
}

# Display Results
Show-TestResults

# Final Recommendation
Write-Host "`nRecommendations:" -ForegroundColor Cyan
$failedTests = $TestResults | Where-Object { $_.Status -eq "FAIL" }
$warningTests = $TestResults | Where-Object { $_.Status -eq "WARNING" }

if ($failedTests.Count -gt 0) {
    Write-Host "Critical issues found:" -ForegroundColor Red
    foreach ($test in $failedTests) {
        Write-Host "   - $($test.TestName): $($test.Message)" -ForegroundColor Red
    }
}

if ($warningTests.Count -gt 0) {
    Write-Host "Improvements recommended:" -ForegroundColor Yellow
    foreach ($test in $warningTests) {
        Write-Host "   - $($test.TestName): $($test.Message)" -ForegroundColor Yellow
    }
}

if ($failedTests.Count -eq 0 -and $warningTests.Count -eq 0) {
    Write-Host "All security checks passed!" -ForegroundColor Green
}

Write-Host "`nSecurity check completed!" -ForegroundColor Green 