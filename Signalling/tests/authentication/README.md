# Authentication Tests

This directory contains comprehensive tests for the authentication strategies used in the Pixel Streaming signalling server.

## Test Files

### `checkActiveInstanceStrategy.test.ts`

Tests for the `checkActiveInstanceStrategy` authentication strategy which validates user tokens against an external API and authenticates users based on active instance status.

#### Test Coverage

The tests cover the following scenarios:

**Token Extraction:**
- Extracting Bearer tokens from Authorization headers
- Fallback to query parameter tokens
- Handling invalid Authorization headers
- Handling missing tokens

**Configuration Validation:**
- Missing or invalid `api_domain` configuration
- Missing `license_id` handling
- Missing or null payload handling

**Successful Authentication:**
- Valid token with existing user authentication
- API success but user not found scenarios

**API Response Handling:**
- Non-200 HTTP status codes (401, 403, 500, etc.)
- Various error response scenarios

**Error Handling:**
- Axios response errors (HTTP errors)
- Axios request errors (network errors)
- Axios setup/configuration errors
- Non-axios errors
- Timeout errors
- Database connection errors

**Request Configuration:**
- Correct HTTP headers and timeout settings
- Proper API URL construction
- License ID inclusion in request payload
- Complex payload object handling

**Edge Cases:**
- Empty Bearer tokens
- Complex nested payload objects
- Original payload object mutation protection

## Running Tests

To run the authentication tests:

```bash
cd /path/to/Signalling/tests
npm test -- authentication/
```

To run a specific test file:

```bash
npm test -- authentication/checkActiveInstanceStrategy.test.ts
```

## Test Framework

The tests use:
- **Vitest** as the test runner
- **Vi** for mocking and spying
- Comprehensive mocking of external dependencies (axios, database, logger)

## Mocking Strategy

The tests mock:
- `axios` HTTP client for API requests
- `findUserByUsername` database function
- `Logger` for logging operations

This ensures tests run in isolation without external dependencies.
