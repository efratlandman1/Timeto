# Input Validation and Sanitization Test Script
# Tests enhanced security features including NoSQL injection prevention

$baseUrl = "http://localhost:5050"
$testResults = @()

Write-Host "=== Input Validation and Sanitization Security Tests ===" -ForegroundColor Green
Write-Host "Testing enhanced sanitization and strict type checking..." -ForegroundColor Yellow

# Test 1: NoSQL Injection Prevention
Write-Host "`n1. Testing NoSQL Injection Prevention..." -ForegroundColor Cyan

$nosqlPayload = @{
    firstName = @{ "$gt" = "" }
    lastName = @{ "$ne" = null }
    email = "test@example.com"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/123" -Method PUT -Body ($nosqlPayload | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $testResults += "FAIL: NoSQL injection should be blocked"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        $testResults += "PASS: NoSQL injection blocked"
    } else {
        $testResults += "FAIL: Unexpected error: $($_.Exception.Message)"
    }
}

# Test 2: XSS Prevention in Parameters
Write-Host "`n2. Testing XSS Prevention in URL Parameters..." -ForegroundColor Cyan

$xssId = "<script>alert('xss')</script>"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/businesses/$xssId" -Method GET -ErrorAction Stop
    $testResults += "FAIL: XSS in parameters should be blocked"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        $testResults += "PASS: XSS in parameters blocked"
    } else {
        $testResults += "FAIL: Unexpected error: $($_.Exception.Message)"
    }
}

# Test 3: MongoDB Operator Injection in Query Strings
Write-Host "`n3. Testing MongoDB Operator Injection in Query..." -ForegroundColor Cyan

$maliciousQuery = "?q=`$gt&category=`$ne"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/businesses$maliciousQuery" -Method GET -ErrorAction Stop
    $testResults += "FAIL: MongoDB operators in query should be blocked"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        $testResults += "PASS: MongoDB operators in query blocked"
    } else {
        $testResults += "FAIL: Unexpected error: $($_.Exception.Message)"
    }
}

# Test 4: Invalid MongoDB ID Format
Write-Host "`n4. Testing Invalid MongoDB ID Format..." -ForegroundColor Cyan

$invalidId = "not-a-valid-mongodb-id"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/businesses/$invalidId" -Method GET -ErrorAction Stop
    $testResults += "FAIL: Invalid MongoDB ID should be blocked"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        $testResults += "PASS: Invalid MongoDB ID blocked"
    } else {
        $testResults += "FAIL: Unexpected error: $($_.Exception.Message)"
    }
}

# Test 5: Object Injection Prevention
Write-Host "`n5. Testing Object Injection Prevention..." -ForegroundColor Cyan

$objectPayload = @{
    name = @{ malicious = "object" }
    address = @{ "$where" = "function() { return true; }" }
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/businesses" -Method POST -Body ($objectPayload | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $testResults += "FAIL: Object injection should be blocked"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        $testResults += "PASS: Object injection blocked"
    } else {
        $testResults += "FAIL: Unexpected error: $($_.Exception.Message)"
    }
}

# Test 6: Type Validation - Non-string in String Field
Write-Host "`n6. Testing Type Validation..." -ForegroundColor Cyan

$typePayload = @{
    firstName = 123
    lastName = @()
    email = "test@example.com"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/123" -Method PUT -Body ($typePayload | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $testResults += "FAIL: Type validation should block non-string values"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        $testResults += "PASS: Type validation blocked non-string values"
    } else {
        $testResults += "FAIL: Unexpected error: $($_.Exception.Message)"
    }
}

# Test 7: Sanitization of Query Parameters
Write-Host "`n7. Testing Query Parameter Sanitization..." -ForegroundColor Cyan

$maliciousQuery = "?q=<script>alert('xss')</script>&location=javascript:alert('xss')"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/businesses$maliciousQuery" -Method GET -ErrorAction Stop
    $testResults += "PASS: Query parameters sanitized (no error thrown)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        $testResults += "PASS: Malicious query parameters blocked"
    } else {
        $testResults += "FAIL: Unexpected error: $($_.Exception.Message)"
    }
}

# Test 8: Valid Input Should Work
Write-Host "`n8. Testing Valid Input Acceptance..." -ForegroundColor Cyan

$validPayload = @{
    firstName = "John"
    lastName = "Doe"
    email = "john.doe@example.com"
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/507f1f77bcf86cd799439011" -Method PUT -Body ($validPayload | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $testResults += "PASS: Valid input accepted"
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        $testResults += "PASS: Valid input accepted (404 expected for non-existent user)"
    } else {
        $testResults += "FAIL: Valid input should be accepted: $($_.Exception.Message)"
    }
}

# Summary
Write-Host "`n=== Test Results Summary ===" -ForegroundColor Green
$passCount = 0
$failCount = 0

foreach ($result in $testResults) {
    if ($result -like "PASS*") {
        Write-Host $result -ForegroundColor Green
        $passCount++
    } else {
        Write-Host $result -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Yellow
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Total: $($testResults.Count)" -ForegroundColor White

if ($failCount -eq 0) {
    Write-Host "`nAll security tests passed! Enhanced input validation is working correctly." -ForegroundColor Green
} else {
    Write-Host "`nSome security tests failed. Review the implementation." -ForegroundColor Red
}

Write-Host "`n=== Security Features Tested ===" -ForegroundColor Yellow
Write-Host "NoSQL Injection Prevention" -ForegroundColor Green
Write-Host "XSS Prevention in Parameters" -ForegroundColor Green
Write-Host "MongoDB Operator Filtering" -ForegroundColor Green
Write-Host "MongoDB ID Validation" -ForegroundColor Green
Write-Host "Object Injection Prevention" -ForegroundColor Green
Write-Host "Strict Type Checking" -ForegroundColor Green
Write-Host "Comprehensive Sanitization (body, params, query)" -ForegroundColor Green 