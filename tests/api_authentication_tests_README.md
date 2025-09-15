# API Tests

This directory contains automated tests for the TimeTo API endpoints.

## Test Files

### `api_authentication_tests.ps1`
PowerShell script that tests all API endpoints with different authentication levels:

- **Public endpoints** (no authentication required)
- **Optional authentication** (works with or without token)
- **Required authentication** (requires valid token)
- **Admin endpoints** (requires admin token)
- **Security tests** (verifies unauthorized access returns 401)

## How to Run

### From the project root:
```powershell
powershell -ExecutionPolicy Bypass -File tests\api_authentication_tests.ps1
```

### From the tests directory:
```powershell
cd tests
powershell -ExecutionPolicy Bypass -File api_authentication_tests.ps1
```

## Test Categories

### 1. Public Tests (publicRoute)
- Categories: `GET /api/v1/categories`
- Services: `GET /api/v1/services`
- Stats: `GET /api/v1/stats/home`

### 2. Optional Auth Tests (optionalAuth)
- Businesses: `GET /api/v1/businesses` (with/without token)
- All Businesses: `GET /api/v1/businesses/all`

### 3. Required Auth Tests (requireAuth)
- My Businesses: `GET /api/v1/businesses/user-businesses`
- My Favorites: `GET /api/v1/favorites/user-favorites`
- My Suggestions: `GET /api/v1/suggestions/my-suggestions`

### 4. Admin Tests (requireAdmin)
- All Users: `GET /api/v1/users`
- All Suggestions: `GET /api/v1/suggestions`

### 5. Security Tests
- Unauthorized access to protected endpoints (should return 401)

## Expected Results

- ✅ **Green**: Test passed successfully
- ❌ **Red**: Test failed (check error message)
- **401 errors**: Expected for unauthorized access to protected endpoints

## Notes

- Update the `$token` variable in the script with a valid admin token
- The script uses `localhost:5050` as the base URL
- All tests use PowerShell's `Invoke-RestMethod` for HTTP requests 