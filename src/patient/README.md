# Patient Module

This module handles patient management for dental clinics. It provides comprehensive CRUD operations for patients with detailed medical information tracking.

## Features

- **Patient Creation**: Create patients with detailed medical information
- **Patient Management**: Full CRUD operations with tenant-based access control
- **Medical History Tracking**: Track allergies, medical conditions, and dental history
- **Search & Filtering**: Advanced search and filtering capabilities
- **Statistics**: Get patient statistics for the clinic
- **Soft Delete**: Safe deletion with data preservation

## Data Structure

### Patient Entity
- Basic information (name, phone, email, address)
- Personal details (gender, birth date)
- Emergency contact information
- Insurance details
- Medical information:
  - Allergies (list of allergy objects)
  - Medical history (conditions, medications)
  - Previous dental history (procedures, teeth treated)
  - Pregnancy status (for female patients)

### Allergy Object
```typescript
{
  name: string;        // Allergy name (e.g., "Penicillin")
  description?: string; // Reaction description
  severity?: string;    // Severity level (e.g., "High", "Medium", "Low")
}
```

### Medical History Object
```typescript
{
  condition: string;           // Medical condition name
  description?: string;        // Condition description
  diagnosedDate?: string;      // Date diagnosed
  isActive?: boolean;          // Whether condition is currently active
  medications?: string[];      // Current medications
}
```

### Dental History Object
```typescript
{
  procedure: string;           // Type of dental procedure
  tooth?: string;             // Specific tooth treated
  performedDate?: string;     // Date procedure was performed
  performedBy?: string;       // Dentist who performed procedure
  notes?: string;             // Additional notes
}
```

## API Endpoints

### Authentication
All endpoints require authentication via Bearer token.

### Create Patient
```http
POST /patients
Content-Type: application/json
Authorization: Bearer <token>

{
  "fullName": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "gender": "male",
  "birthDate": "1990-01-01",
  "allergies": [
    {
      "name": "Penicillin",
      "description": "Severe reaction",
      "severity": "High"
    }
  ],
  "medicalHistories": [
    {
      "condition": "Diabetes",
      "description": "Type 2 diabetes",
      "diagnosedDate": "2020-01-01",
      "isActive": true,
      "medications": ["Metformin"]
    }
  ],
  "previousDentalHistory": [
    {
      "procedure": "Filling",
      "tooth": "Tooth 14",
      "performedDate": "2023-06-15",
      "performedBy": "Dr. Smith",
      "notes": "Good condition"
    }
  ]
}
```

### Get All Patients
```http
GET /patients?search=john&page=1&limit=10
Authorization: Bearer <token>
```

Query Parameters:
- `search`: Search by name, phone, or email
- `phone`: Filter by phone number
- `email`: Filter by email
- `gender`: Filter by gender (male/female)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Get Patient Statistics
```http
GET /patients/stats
Authorization: Bearer <token>
```

Returns:
```json
{
  "total": 150,
  "male": 75,
  "female": 75,
  "thisMonth": 12,
  "deleted": 5
}
```

### Get Patient by ID
```http
GET /patients/:id
Authorization: Bearer <token>
```

### Update Patient
```http
PATCH /patients/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "fullName": "John Smith",
  "allergies": [
    {
      "name": "Latex",
      "description": "Mild skin irritation",
      "severity": "Low"
    }
  ]
}
```

### Delete Patient (Soft Delete)
```http
DELETE /patients/:id
Authorization: Bearer <token>
```

### Get Deleted Patients
```http
GET /patients/deleted?page=1&limit=10
Authorization: Bearer <token>
```

### Restore Deleted Patient
```http
PATCH /patients/:id/restore
Authorization: Bearer <token>
```

### Permanently Delete Patient
```http
DELETE /patients/:id/permanent
Authorization: Bearer <token>
```

⚠️ **Warning**: Permanent deletion cannot be undone and will remove all patient data from the database.

### Get Patient Including Deleted
```http
GET /patients/:id/deleted
Authorization: Bearer <token>
```

## Soft Delete Management

The patient module implements comprehensive soft delete functionality:

### Soft Delete Features:
- **Safe Deletion**: Patients are soft deleted by default, preserving data for audit purposes
- **Restore Capability**: Deleted patients can be restored if needed
- **Conflict Prevention**: Restore operations check for phone number conflicts
- **Permanent Deletion**: Option to permanently delete patients (use with caution)
- **Deleted Patient Access**: Special endpoints to view and manage deleted patients

### Soft Delete Behavior:
- Regular `DELETE /patients/:id` performs soft delete
- Deleted patients are excluded from normal queries
- `GET /patients/deleted` shows only deleted patients
- `PATCH /patients/:id/restore` restores deleted patients
- `DELETE /patients/:id/permanent` permanently removes data

### Auto-Restore on Creation:
- If you try to create a patient with a phone number that belongs to a deleted patient, the system will automatically restore and update the deleted patient instead of creating a new one.

## Tenant-Based Access Control

All patient operations are scoped to the user's tenant (clinic). Users can only:
- Create patients in their own clinic
- View patients from their own clinic
- Update patients from their own clinic
- Delete patients from their own clinic
- Restore patients in their own clinic
- Permanently delete patients in their own clinic

The tenant ID is automatically determined from the authenticated user's staff record.

## Error Handling

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Patient not found
- `409 Conflict`: Phone number already exists in the clinic
- `409 Conflict`: Cannot restore patient (active patient with same phone exists)

## Usage Examples

### Creating a Patient with Medical Information

```typescript
const patientData = {
  fullName: "Sarah Johnson",
  phone: "+1234567890",
  email: "sarah@example.com",
  gender: "female",
  birthDate: "1985-05-15",
  allergies: [
    {
      name: "Sulfa drugs",
      description: "Rash and itching",
      severity: "Medium"
    }
  ],
  medicalHistories: [
    {
      condition: "Hypertension",
      description: "High blood pressure",
      diagnosedDate: "2018-03-10",
      isActive: true,
      medications: ["Lisinopril"]
    }
  ],
  previousDentalHistory: [
    {
      procedure: "Root Canal",
      tooth: "Tooth 19",
      performedDate: "2022-11-20",
      performedBy: "Dr. Wilson",
      notes: "Completed successfully"
    }
  ]
};
```

### Searching Patients

```typescript
// Search by name
const results = await patientService.findAll(tenantId, { search: "john" });

// Filter by gender
const femalePatients = await patientService.findAll(tenantId, { gender: "female" });

// Pagination
const page2 = await patientService.findAll(tenantId, { page: 2, limit: 20 });
```

## Integration with Other Modules

- **Staff Module**: Used to determine tenant ID from authenticated user
- **Appointment Module**: Patients can have multiple appointments
- **Document Module**: Patients can have multiple documents
- **Treatment Module**: Patients can have multiple treatments
- **Attachment Module**: Patients can have multiple file attachments

## Database Schema

The patient entity includes indexes for efficient querying:
- `idx_patient_tenant_id`: For tenant-based queries
- `idx_patient_full_name`: For name-based searches
- `idx_patient_deleted_at`: For soft delete filtering
- Unique constraint on `[tenantId, phone]`: Ensures phone uniqueness per clinic 