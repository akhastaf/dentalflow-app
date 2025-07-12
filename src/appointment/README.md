# Appointment Module

A robust appointment management system for dental clinics, supporting booking, rescheduling, status management, and soft delete.

## Features
- Create, update, reschedule, and delete appointments
- Soft delete and restore functionality
- Status management (pending, confirmed, cancelled, etc.)
- Filtering and listing with flexible queries
- Prevents double-booking for doctors
- Recurring appointments support
- Swagger API documentation

## Database Schema

### Appointment Entity
```typescript
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ type: 'date' })
  date: string;
  @Column({ type: 'time' })
  startTime: string;
  @Column({ type: 'time', nullable: true })
  endTime: string;
  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'cancelled', 'no_show', 'finished', 'rescheduled'],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'finished' | 'rescheduled';
  @Column({
    type: 'enum',
    enum: ['staff', 'public_form', 'auto_from_treatment', 'referral'],
    default: 'staff',
  })
  createdVia: 'staff' | 'public_form' | 'auto_from_treatment' | 'referral';
  @Column({ type: 'text', nullable: true })
  notes: string;
  // ... relationships ...
  @DeleteDateColumn()
  deletedAt: Date;
  // ... other fields ...
}
```

## API Endpoints

### Core CRUD
- `POST /appointments` — Create appointment
- `GET /appointments/:id` — Get by ID
- `GET /appointments` — List/filter appointments
- `PATCH /appointments/:id` — Update appointment
- `PATCH /appointments/:id/reschedule` — Reschedule appointment
- `DELETE /appointments/:id` — Soft delete appointment

### Status & Soft Delete
- `PATCH /appointments/:id/status` — Update status
- `PATCH /appointments/:id/restore` — Restore soft-deleted appointment
- `GET /appointments/deleted/list` — List soft-deleted appointments

## Status Logic
- **pending**: Default when created
- **confirmed**: Set when confirmed by staff or patient
- **cancelled**: Set when cancelled
- **no_show**: Set if patient does not show up
- **finished**: Set when appointment is completed
- **rescheduled**: Set when rescheduled (old appointment is marked as rescheduled, new one is created)

## Soft Delete
- Uses TypeORM's `softRemove` and `restore`
- Deleted appointments are not permanently removed and can be restored
- Use `GET /appointments/deleted/list` to view deleted appointments

## Usage Examples

### Create Appointment
```http
POST /appointments
{
  "patientId": "uuid",
  "tenantId": "uuid",
  "doctorId": "uuid",
  "date": "2025-07-04",
  "startTime": "10:30:00",
  "endTime": "11:00:00",
  "notes": "First visit"
}
```

### Update Status
```http
PATCH /appointments/{id}/status
{
  "status": "confirmed"
}
```

### Soft Delete
```http
DELETE /appointments/{id}
```

### Restore
```http
PATCH /appointments/{id}/restore
```

### List Deleted
```http
GET /appointments/deleted/list
```

## Business Logic
- Prevents double-booking for the same doctor, tenant, date, and time
- Supports recurring and rescheduled appointments
- All status changes are tracked

## Testing
- Unit and integration tests recommended for all endpoints

## Migration Notes
- Ensure `deletedAt` column exists for soft delete
- Ensure unique constraint on doctor/tenant/date/startTime

## Dependencies
- @nestjs/common, @nestjs/typeorm, class-validator, class-transformer, @nestjs/swagger 