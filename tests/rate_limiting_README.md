# Rate Limiting Test Suite

## Overview
This test suite validates the rate limiting implementation across all API endpoints.

## Rate Limiting Configuration

### 1. General Limiter
- **Limit**: 250 requests per 15 minutes
- **Applied to**: All GET routes without specific limiters
- **Routes**: `/businesses`, `/categories`, `/services`, `/stats/home`, etc.

### 2. Auth Limiter  
- **Limit**: 5 requests per 15 minutes
- **Applied to**: All authentication routes
- **Routes**: `/auth`, `/google`, `/request-password-reset`, etc.

### 3. Write Limiter
- **Limit**: 40 requests per 15 minutes  
- **Applied to**: All data modification operations (POST, PUT, DELETE, PATCH)
- **Routes**: All business, user, category, service modification routes

## How to Run Tests

### Prerequisites
1. Make sure the server is running on `http://localhost:5050`
2. PowerShell execution policy should allow running scripts

### Running the Tests

#### Option 1: PowerShell (Recommended)
```powershell
# Navigate to the tests directory
cd tests

# Run the test script
.\rate_limiting_test.ps1
```

#### Option 2: Manual Testing with curl
```bash
# Test general limiter
curl -X GET http://localhost:5050/api/v1/businesses

# Test auth limiter (should fail after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:5050/api/v1/auth \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
done

# Test write limiter (should fail after 40 attempts)
for i in {1..45}; do
  curl -X POST http://localhost:5050/api/v1/businesses \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Business","description":"Test"}'
done
```

## What the Tests Check

### 1. General Limiter Test
- Tests GET routes that use `generalLimiter`
- Verifies 250 requests are allowed per 15 minutes
- Routes tested: `/businesses`, `/categories`, `/services`, `/stats/home`

### 2. Auth Limiter Test  
- Tests authentication routes that use `authLimiter`
- Verifies only 5 requests are allowed per 15 minutes
- Routes tested: `/auth`, `/google`

### 3. Write Limiter Test
- Tests data modification routes that use `writeLimiter`
- Verifies only 40 requests are allowed per 15 minutes
- Routes tested: POST operations on `/businesses`, `/categories`, `/services`

### 4. Headers Test
- Checks if rate limit headers are present
- Headers checked: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

### 5. Per-IP Test
- Tests if rate limiting is applied per IP address
- Uses different User-Agent headers to simulate different clients

## Expected Results

### Success Indicators
- ✅ First requests to each route succeed
- ✅ Rate limiting blocks excessive requests
- ✅ Rate limit headers are present in responses
- ✅ Different User-Agents can make requests (simulating different IPs)

### Common Issues
- ❌ Server not running on port 5050
- ❌ Authentication required for some routes
- ❌ PowerShell execution policy blocking script
- ❌ Network connectivity issues

## Troubleshooting

### PowerShell Execution Policy
If you get execution policy errors:
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy to allow local scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Server Not Running
Make sure the server is started:
```bash
cd server
npm start
```

### Authentication Issues
Some routes require authentication. The test script handles this by expecting failures for auth routes.

## Rate Limiting Headers

The API should return these headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests in current window  
- `RateLimit-Reset`: Time when the limit resets (Unix timestamp)

## Configuration Files

- **Rate Limiter**: `server/middlewares/rateLimiter.js`
- **Route Configuration**: Each route file in `server/routes/`
- **Server Setup**: `server/server.js`

## Modifying Limits

To change rate limits, edit `server/middlewares/rateLimiter.js`:

```javascript
// Change general limiter from 250 to 300
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Changed from 250
    // ...
});
``` 