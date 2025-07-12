# Staff Module

This module handles staff management for dental clinics. It provides comprehensive CRUD operations for staff members with role-based access control and tenant-based isolation.

## Features

- **Staff Management**: Full CRUD operations with tenant-based access control
- **User Account Creation**: Create complete user accounts with passwords for new staff members
- **Role Assignment**: Assign users to specific roles (admin, doctor, assistant, reception)
- **Permission Override**: Custom permissions for individual staff members
- **Working Schedule**: Track working days and salary information
- **Search & Filtering**: Advanced search and filtering capabilities
- **Statistics**: Get staff statistics by role
- **Soft Delete**: Safe deletion with data preservation

## Data Structure

### Staff Entity
- **Basic Information**: Links user to tenant and role
- **Role Assignment**: One of the predefined roles (admin, doctor, assistant, reception)
- **Working Schedule**: Array of working days (1=Monday, 2=Tuesday, etc.)
- **Salary Information**: Type (fixed/percentage) and amount
- **Custom Permissions**: Optional override of default role permissions

### Available Roles
- **ADMIN**: Full access to all features
- **DOCTOR**: Patient and appointment management
- **ASSISTANT**: Limited patient and appointment access
- **RECEPTION**: Basic patient and appointment access

### Default Permissions by Role

#### Admin
- All permissions: `patient_*`, `appointment_*`, `staff_*`, `document_*`, `payment_*`, `report_*`

#### Doctor
- `patient_read`, `patient_write`, `patient_delete`
- `appointment_read`, `appointment_write`, `appointment_delete`
- `document_read`, `document_write`
- `payment_read`, `payment_write`

#### Assistant
- `patient_read`, `patient_write`
- `appointment_read`, `appointment_write`
- `document_read`

#### Reception
- `patient_read`, `patient_write`
- `appointment_read`, `appointment_write`

## API Endpoints

### Authentication
All endpoints require authentication via Bearer token.

### Create Staff Member (Assign Existing User)
```http
POST /staff
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "user-uuid",
  "role": "doctor",
  "workingDays": [1, 2, 3, 4, 5],
  "salaryType": "fixed",
  "salaryAmount": 8000.00,
  "customPermissions": [
    "patient_read",
    "patient_write",
    "appointment_read",
    "appointment_write"
  ]
}
```

### Create Staff Member with User Account
```http
POST /staff/with-user
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "doctor.smith@clinic.com",
  "first_name": "Dr. John",
  "last_name": "Smith",
  "password": "securePassword123",
  "role": "doctor",
  "workingDays": [1, 2, 3, 4, 5],
  "salaryType": "fixed",
  "salaryAmount": 8000.00,
  "customPermissions": [
    "patient_read",
    "patient_write",
    "appointment_read",
    "appointment_write",
    "document_read",
    "document_write"
  ]
}
```

**Returns:**
```json
{
  "staff": {
    "id": "staff-uuid",
    "userId": "user-uuid",
    "role": "doctor",
    "workingDays": [1, 2, 3, 4, 5],
    "salaryType": "fixed",
    "salaryAmount": 8000.00,
    "customPermissions": ["patient_read", "patient_write", ...],
    "tenantId": "tenant-uuid"
  },
  "user": {
    "user_id": "user-uuid",
    "email": "doctor.smith@clinic.com",
    "first_name": "Dr. John",
    "last_name": "Smith",
    "is_active": true
  }
}
```

### Get All Staff Members
```http
GET /staff?search=john&role=doctor&page=1&limit=10
Authorization: Bearer <token>
```

Query Parameters:
- `search`: Search by user name or email
- `role`: Filter by role (admin, doctor, assistant, reception)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Get Staff Statistics
```http
GET /staff/stats
Authorization: Bearer <token>
```

Returns:
```json
{
  "total": 8,
  "byRole": {
    "admin": 1,
    "doctor": 3,
    "assistant": 2,
    "reception": 2
  }
}
```

### Get Staff Member by ID
```http
GET /staff/:id
Authorization: Bearer <token>
```

### Update Staff Member
```http
PATCH /staff/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "role": "admin",
  "workingDays": [1, 2, 3, 4, 5, 6],
  "salaryAmount": 10000.00,
  "customPermissions": [
    "patient_read",
    "patient_write",
    "appointment_read",
    "appointment_write",
    "staff_read",
    "staff_write"
  ]
}
```

### Delete Staff Member (Soft Delete)
```http
DELETE /staff/:id
Authorization: Bearer <token>
```

### Get Deleted Staff Members
```http
GET /staff/deleted?page=1&limit=10
Authorization: Bearer <token>
```

### Restore Deleted Staff Member
```http
PATCH /staff/:id/restore
Authorization: Bearer <token>
```

### Permanently Delete Staff Member
```http
DELETE /staff/:id/permanent
Authorization: Bearer <token>
```

⚠️ **Warning**: Permanent deletion cannot be undone and will remove all staff data from the database.

## Tenant-Based Access Control

All staff operations are scoped to the user's tenant (clinic). Users can only:
- Create staff members in their own clinic
- View staff members from their own clinic
- Update staff members from their own clinic
- Delete staff members from their own clinic
- Restore staff members in their own clinic
- Permanently delete staff members in their own clinic

The tenant ID is automatically determined from the authenticated user's staff record.

## Role-Based Access Control

### Permission System
- **Default Permissions**: Each role has predefined permissions
- **Custom Permissions**: Admins can override default permissions for individual staff members
- **Permission Format**: `resource_action` (e.g., `patient_read`, `appointment_write`)

### Permission Enforcement
Permissions are checked at the service level before performing operations:
```typescript
// Example permission check
if (!ability.can('read', 'Patient')) {
  throw new ForbiddenException('Insufficient permissions');
}
```

## Error Handling

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Staff member not found
- `409 Conflict`: User is already a staff member in this clinic

## Usage Examples

### Creating a Staff Member (Assign Existing User)
```typescript
const staffData = {
  userId: "user-uuid",
  role: "doctor",
  workingDays: [1, 2, 3, 4, 5],
  salaryType: "fixed",
  salaryAmount: 8000.00,
  customPermissions: [
    "patient_read",
    "patient_write",
    "appointment_read",
    "appointment_write"
  ]
};

const staff = await staffService.create(staffData, tenantId);
```

### Creating a Staff Member with User Account
```typescript
const staffWithUserData = {
  email: "doctor.smith@clinic.com",
  first_name: "Dr. John",
  last_name: "Smith",
  password: "securePassword123",
  role: "doctor",
  workingDays: [1, 2, 3, 4, 5],
  salaryType: "fixed",
  salaryAmount: 8000.00,
  customPermissions: [
    "patient_read",
    "patient_write",
    "appointment_read",
    "appointment_write",
    "document_read",
    "document_write"
  ]
};

const { staff, user } = await staffService.createWithUser(staffWithUserData, tenantId);
// User can now login with email and password
```

### Searching Staff Members
```typescript
// Search by name
const results = await staffService.findAll(tenantId, { search: "john" });

// Filter by role
const doctors = await staffService.findAll(tenantId, { role: "doctor" });

// Pagination
const page2 = await staffService.findAll(tenantId, { page: 2, limit: 20 });
```

### Updating Staff Permissions
```typescript
const updateData = {
  customPermissions: [
    "patient_read",
    "patient_write",
    "appointment_read",
    "appointment_write",
    "document_read"
  ]
};

const updatedStaff = await staffService.update(staffId, updateData, tenantId);
```

## Integration with Other Modules

- **User Module**: Staff members are linked to user accounts
- **Tenant Module**: Staff members belong to specific clinics
- **Patient Module**: Staff members can access patients based on permissions
- **Appointment Module**: Staff members can manage appointments based on permissions
- **CASL.js**: Used for permission checking and role-based access control

## Database Schema

The staff entity includes indexes for efficient querying:
- `idx_staff_tenant_id`: For tenant-based queries
- Unique constraint on `[tenantId, userId]`: Ensures one staff record per user per tenant
- Soft delete support with `deletedAt` column

## Security Considerations

1. **Tenant Isolation**: All operations are scoped to the user's tenant
2. **Permission Validation**: All operations check user permissions before execution
3. **Role-Based Access**: Different roles have different permission levels
4. **Audit Trail**: Soft delete preserves data for audit purposes
5. **Input Validation**: All inputs are validated using class-validator 