# Waiting Room Module

A comprehensive waiting room management system for dental clinics that allows staff to manage patient queues, assign doctors, and track consultation status.

## Features

### Core Functionality
- **Patient Queue Management**: Add patients to waiting room with priority ordering
- **Emergency Levels**: Mark patients as normal, urgent, or emergency
- **Doctor Assignment**: Assign specific doctors to patients when calling them
- **Status Tracking**: Track patient status (waiting, called, in consultation, completed, cancelled)
- **Order Management**: Reorder patients in the queue
- **Soft Delete**: Safely remove patients from waiting room

### User Roles
- **Admin**: Full access to all waiting room operations
- **Doctor**: Can call patients, start/complete consultations, assign to self
- **Assistant**: Can add patients, call patients, update status
- **Receptionist**: Can add patients and basic management

## Database Schema

### WaitingRoom Entity
```typescript
{
  id: string;                    // UUID primary key
  tenantId: string;              // Clinic/tenant ID
  patientId: string;             // Patient reference
  assignedDoctorId?: string;     // Assigned doctor (optional)
  status: WaitingRoomStatus;     // Current status
  emergencyLevel: EmergencyLevel; // Priority level
  order: number;                 // Queue position
  notes?: string;                // Additional notes
  calledBy?: string;             // Staff who called patient
  calledAt?: Date;               // When patient was called
  consultationStartedAt?: Date;   // When consultation started
  consultationEndedAt?: Date;     // When consultation ended
  cancelledAt?: Date;            // When cancelled
  cancelledBy?: string;          // Staff who cancelled
  cancellationReason?: string;    // Reason for cancellation
  createdAt: Date;               // Entry creation time
  updatedAt: Date;               // Last update time
  deletedAt?: Date;              // Soft delete timestamp
}
```

### Enums

#### WaitingRoomStatus
- `WAITING`: Patient is in queue
- `CALLED`: Patient has been called
- `IN_CONSULTATION`: Patient is with doctor
- `COMPLETED`: Consultation finished
- `CANCELLED`: Patient cancelled/removed

#### EmergencyLevel
- `NORMAL`: Regular appointment
- `URGENT`: Needs attention soon
- `EMERGENCY`: Immediate attention required

## API Endpoints

### Patient Management

#### Add Patient to Waiting Room
```http
POST /waiting-room
Content-Type: application/json

{
  "patientId": "uuid",
  "assignedDoctorId": "uuid", // optional
  "emergencyLevel": "normal", // optional: normal, urgent, emergency
  "order": 1, // optional, auto-assigned if not provided
  "notes": "string" // optional
}
```

#### Get Waiting Room List
```http
GET /waiting-room?page=1&limit=10&search=john&status=waiting&emergencyLevel=urgent
```

#### Get Waiting Room Statistics
```http
GET /waiting-room/statistics
```

#### Get Specific Entry
```http
GET /waiting-room/:id
```

#### Update Entry
```http
PATCH /waiting-room/:id
Content-Type: application/json

{
  "assignedDoctorId": "uuid",
  "emergencyLevel": "urgent",
  "status": "called",
  "order": 2,
  "notes": "Updated notes"
}
```

### Patient Actions

#### Call Patient
```http
POST /waiting-room/:id/call
Content-Type: application/json

{
  "assignedDoctorId": "uuid", // optional
  "notes": "string" // optional
}
```

#### Start Consultation
```http
POST /waiting-room/:id/start-consultation
```

#### Complete Consultation
```http
POST /waiting-room/:id/complete-consultation
```

#### Cancel Patient
```http
POST /waiting-room/:id/cancel
Content-Type: application/json

{
  "reason": "Patient requested cancellation"
}
```

#### Reorder Patients
```http
POST /waiting-room/:id/reorder
Content-Type: application/json

[
  { "id": "uuid1", "newOrder": 1 },
  { "id": "uuid2", "newOrder": 2 },
  { "id": "uuid3", "newOrder": 3 }
]
```

#### Remove Patient
```http
DELETE /waiting-room/:id
```

## Business Logic

### Order Management
- Orders are auto-assigned if not provided
- Orders are unique per tenant
- Emergency patients get priority regardless of order
- Reordering updates all affected entries

### Status Flow
1. **WAITING** → **CALLED** (when patient is called)
2. **CALLED** → **IN_CONSULTATION** (when consultation starts)
3. **IN_CONSULTATION** → **COMPLETED** (when consultation ends)
4. Any status → **CANCELLED** (when cancelled)

### Emergency Priority
- Emergency patients appear first regardless of order
- Urgent patients appear after emergency but before normal
- Within same emergency level, order by queue position

### Doctor Assignment
- Can be assigned when adding to waiting room
- Can be assigned when calling patient
- Can be changed during updates
- Only doctors can be assigned (validated by role)

## Security & Validation

### Tenant Isolation
- All operations are scoped to user's tenant
- Patients must belong to the same tenant
- Staff must belong to the same tenant

### Role-Based Access
- All endpoints require authentication
- Doctor assignment validated against staff roles
- Soft delete prevents data loss

### Data Validation
- Patient existence verified
- Doctor role validation
- Order uniqueness per tenant
- Status transition validation

## Usage Examples

### Adding a New Patient
```typescript
// Add patient to waiting room
const waitingRoomEntry = await waitingRoomService.create(tenantId, {
  patientId: 'patient-uuid',
  emergencyLevel: 'urgent',
  notes: 'Patient has severe pain'
}, staffId);
```

### Calling Next Patient
```typescript
// Call next patient in queue
const calledPatient = await waitingRoomService.callPatient(
  waitingRoomId,
  tenantId,
  { assignedDoctorId: 'doctor-uuid' },
  staffId
);
```

### Getting Queue Statistics
```typescript
// Get waiting room statistics
const stats = await waitingRoomService.getStatistics(tenantId);
// Returns: { total, waiting, called, inConsultation, completed, cancelled, emergency, urgent }
```

## Frontend Integration

The waiting room module is designed to work with real-time updates and can be integrated with:

- **Real-time Dashboard**: Display current queue status
- **Patient Call System**: Audio/visual notifications
- **Doctor Interface**: Manage assigned patients
- **Reception Interface**: Add and manage queue
- **Mobile App**: Patient self-check-in

## Migration

Run the migration to create the waiting room table:

```bash
npm run migration:run
```

This will create the `waiting_room` table with all necessary indexes and foreign key relationships. 