# Two-Factor Authentication (2FA) System Setup

This document describes the implementation of a secure 2FA system with backup codes for the DentalFlow application.

## Overview

The 2FA system implements a multi-step authentication process that maintains security between password validation and final session creation. It supports both authenticator apps (TOTP) and email-based 2FA, with secure backup codes for emergency access.

## Architecture

### Authentication Flow

1. **Primary Authentication** (`/api/auth/login`)
   - User submits username and password
   - Server validates credentials
   - If valid and 2FA is enabled, generates pre-auth token
   - Returns pre-auth token instead of final access token

2. **2FA Verification** (`/api/auth/login/2fa`)
   - User submits 2FA code (authenticator or email) with pre-auth token as Bearer token
   - Server verifies code and generates final access token
   - Returns access token and user data

3. **Backup Code Verification** (`/api/auth/verify-2fa/backup`)
   - User submits backup code with pre-auth token as Bearer token
   - Server verifies backup code and invalidates it
   - Generates final access token and sends security notification

### Security Benefits

- **Pre-auth token protection**: Both 2FA endpoints require the pre-auth token, preventing brute-force attacks without valid password
- **Consistent authentication**: Both regular 2FA and backup code verification use the same token-based approach
- **Stateless verification**: JWT-based tokens don't require database lookups for validation
- **Short-lived tokens**: 10-minute expiration limits the attack window

## Security Features

### Pre-Auth Token System
- Short-lived JWT tokens (10 minutes)
- Separate secret from main JWT tokens
- Stateless verification
- Prevents brute-force attacks on backup codes

### Backup Code Security
- SHA-256 hashed storage (no plaintext)
- Single-use enforcement
- 19-character format: `XXXX-XXXX-XXXX-XXXX`
- Automatic invalidation after use

### Rate Limiting
- Email 2FA: 5 failed attempts = 15-minute lock
- Backup codes: Protected by pre-auth token requirement

### Security Notifications
- Automated email alerts for backup code usage
- Includes access details and security recommendations

## Environment Variables

Add these to your `.env` file:

```env
# 2FA JWT Configuration
JWT_2FA_SECRET=your-super-secret-2fa-jwt-key-here-make-it-long-and-random

# Existing JWT Configuration (ensure these are set)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-here-make-it-long-and-random
JWT_REFRESH_EXPIRATION=7d

# Email Configuration
JWT_EMAIL_VERIFICATION_SECRET=your-super-secret-email-verification-jwt-key-here
JWT_EMAIL_VERIFICATION_EXPIRATION=24h
RESEND_TOKEN=your-resend-api-token-here
DEFAULT_EMAIL=noreply@dentistflow.com

# Application Configuration
CLIENT_URL=http://localhost:3000
COMPANY_NAME=DentalFlow
COMPANY_LOGO=https://your-domain.com/logo.png
COMPANY_ADDRESS=123 Dental Street, City, Country
UNSUBSCRIBE_LINK=https://your-domain.com/unsubscribe

# 2FA Configuration
2FA_CODE_EXPIRATION=10
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
Primary login endpoint. Returns pre-auth token if 2FA is enabled.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (2FA required):**
```json
{
  "access_token": null,
  "user": null,
  "requires2FA": true,
  "twoFactorMethods": {
    "authenticator": true,
    "email": false
  },
  "twoFactorToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 600
}
```

#### POST `/api/auth/login/2fa`
Complete login with 2FA code (authenticator or email code).

**Headers:**
```
Authorization: Bearer <pre-auth-token>
```

**Request:**
```json
{
  "twoFactorCode": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### POST `/api/auth/verify-2fa/backup`
Verify backup code during 2FA login.

**Headers:**
```
Authorization: Bearer <pre-auth-token>
```

**Request:**
```json
{
  "backupCode": "ABCD-EFGH-IJKL-MNOP"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### 2FA Management Endpoints

#### POST `/api/auth/2fa/setup`
Setup 2FA for user account.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "method": "authenticator"
}
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "Scan the QR code with your authenticator app, then verify with a code"
}
```

#### POST `/api/auth/2fa/verify-setup`
Verify 2FA setup with code.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "code": "123456",
  "method": "authenticator"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA has been enabled successfully",
  "backupCodes": [
    "ABCD-EFGH-IJKL-MNOP",
    "QRST-UVWX-YZAB-CDEF",
    "..."
  ]
}
```

## Implementation Details

### Guards

- `AuthGuard`: Protects endpoints requiring full authentication
- `TwoFactorAuthGuard`: Protects backup code verification endpoint with pre-auth token

### Services

- `AuthService`: Main authentication logic
- `TwoFactorService`: 2FA-specific operations
- `MailService`: Email notifications and 2FA codes

### Database Schema

The User entity includes these 2FA-related fields:

```typescript
// Authenticator 2FA
twoFactorAuthenticatorSecret?: string;
twoFactorAuthenticatorEnabled: boolean;

// Email 2FA
twoFactorEmailEnabled: boolean;
twoFactorEmailSecret?: string;
twoFactorEmailExpiresAt?: Date;
twoFactorEmailAttempts: number;
twoFactorEmailLockedUntil?: Date;

// Backup Codes
twoFactorBackupCodes?: string; // JSON array of hashed codes

// Verification
twoFactorVerifiedAt?: Date;
```

## Security Best Practices

1. **Never store backup codes in plaintext**
2. **Enforce single-use for backup codes**
3. **Apply rate limiting to prevent brute-force attacks**
4. **Send security notifications for backup code usage**
5. **Use separate JWT secrets for different token types**
6. **Implement proper token expiration**
7. **Don't disable 2FA when backup codes are used**

## Testing

### Generate JWT 2FA Secret

```bash
# Generate a secure random string for JWT_2FA_SECRET
openssl rand -base64 32
```

### Test Backup Code Format

Backup codes should be in the format: `XXXX-XXXX-XXXX-XXXX` (19 characters total)

Example: `ABCD-EFGH-IJKL-MNOP`

## Troubleshooting

### Common Issues

1. **"JWT_2FA_SECRET is not configured"**
   - Ensure JWT_2FA_SECRET is set in your .env file
   - Restart the application after adding the variable

2. **"Invalid 2FA token"**
   - Check that the pre-auth token is valid and not expired
   - Verify the token was generated from a successful password login

3. **"Backup code must be exactly 19 characters"**
   - Ensure backup codes include the dashes: `XXXX-XXXX-XXXX-XXXX`
   - Check for extra spaces or characters

4. **"Invalid backup code"**
   - Verify the code hasn't been used before (single-use enforcement)
   - Check that the code format is correct
   - Ensure the user has backup codes generated

## Migration Notes

If upgrading from an existing 2FA implementation:

1. Add the new `JWT_2FA_SECRET` environment variable
2. Update any existing backup codes to the new format
3. Test the new backup code verification endpoint
4. Update frontend to handle the new pre-auth token flow 