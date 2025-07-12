# Treatment Module

A comprehensive treatment management system for dental practices, supporting individual treatments, treatment plans, progress tracking, and financial management.

## Features

### Core Treatment Management
- **Individual Treatments**: Create, update, and manage individual dental treatments
- **Treatment Plans**: Comprehensive treatment plans with multiple phases and treatments
- **Progress Tracking**: Real-time progress updates with automatic status management
- **Financial Integration**: Cost tracking, discounts, and payment management
- **Clinical Documentation**: Diagnosis, clinical notes, and post-treatment instructions

### Advanced Features
- **Priority Management**: Urgent, high, medium, and low priority treatments
- **Phase Tracking**: Diagnosis, planning, execution, follow-up, and maintenance phases
- **Dependency Management**: Parent-child treatment relationships
- **Tooth Mapping**: FDI format tooth number tracking
- **Scheduling Integration**: Planned dates and estimated durations

### Analytics & Reporting
- **Treatment Statistics**: Comprehensive analytics on treatment performance
- **Financial Reports**: Revenue tracking and payment analysis
- **Progress Analytics**: Average progress and completion rates
- **Patient History**: Complete treatment history per patient

## Entities

### Treatment
The core treatment entity with comprehensive clinical and financial data.

**Key Fields:**
- `status`: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD
- `priority`: URGENT, HIGH, MEDIUM, LOW
- `phase`: DIAGNOSIS, TREATMENT_PLANNING, TREATMENT_EXECUTION, FOLLOW_UP, MAINTENANCE
- `toothNumber`: FDI format (e.g., "11", "36")
- `amount`, `amountPaid`, `discountAmount`, `discountPercentage`
- `progressPercentage`: 0-100 progress tracking
- `plannedDate`, `completedDate`, `estimatedDuration`

### TreatmentPlan
Comprehensive treatment plans that can contain multiple treatments.

**Key Fields:**
- `status`: DRAFT, ACTIVE, COMPLETED, CANCELLED, ON_HOLD
- `priority`: URGENT, HIGH, MEDIUM, LOW
- `totalAmount`, `totalAmountPaid`, `totalDiscountAmount`
- `progressPercentage`: Auto-calculated from contained treatments
- `estimatedDurationWeeks`, `startDate`, `estimatedEndDate`, `actualEndDate`

## API Endpoints

### Treatment Management

#### Create Treatment
```http
POST /treatments
Content-Type: application/json

{
  "patientId": "uuid",
  "doctorId": "uuid",
  "tenantTreatmentId": "uuid",
  "amount": 150.00,
  "toothNumber": "11",
  "diagnosis": "Cavity in upper right central incisor",
  "plannedDate": "2024-01-15",
  "priority": "MEDIUM",
  "phase": "TREATMENT_PLANNING"
}
```

#### Get Treatments with Filtering
```http
GET /treatments?page=1&limit=10&status=PLANNED&priority=HIGH&patientId=uuid
```

#### Update Treatment
```http
PATCH /treatments/{id}
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "progressPercentage": 50,
  "clinicalNotes": "Patient responded well to initial treatment"
}
```

#### Update Treatment Progress
```http
PATCH /treatments/{id}/progress?progressPercentage=75&progressNotes=Treatment progressing well
```

### Treatment Plan Management

#### Create Treatment Plan
```http
POST /treatments/plans
Content-Type: application/json

{
  "patientId": "uuid",
  "doctorId": "uuid",
  "name": "Comprehensive Orthodontic Treatment",
  "description": "Full orthodontic treatment plan",
  "diagnosis": "Malocclusion requiring comprehensive treatment",
  "treatmentGoals": "Achieve proper alignment and bite",
  "estimatedDurationWeeks": 24,
  "totalAmount": 5000.00
}
```

#### Get Treatment Plans
```http
GET /treatments/plans?patientId=uuid
```

### Analytics & Statistics

#### Treatment Statistics
```http
GET /treatments/statistics/treatments?startDate=2024-01-01&endDate=2024-12-31
```

#### Treatment Plan Statistics
```http
GET /treatments/statistics/plans
```

### Advanced Features

#### Patient Treatment History
```http
GET /treatments/patient/{patientId}
```

#### Upcoming Treatments
```http
GET /treatments/upcoming?days=30
```

#### Overdue Treatments
```http
GET /treatments/overdue
```

## Filtering Options

### Treatment Filters
- `patientId`: Filter by patient
- `doctorId`: Filter by doctor
- `treatmentPlanId`: Filter by treatment plan
- `status`: Filter by treatment status
- `priority`: Filter by priority level
- `phase`: Filter by treatment phase
- `toothNumber`: Filter by specific tooth
- `search`: Search in diagnosis, clinical notes, and notes
- `startDate`/`endDate`: Date range filtering
- `minAmount`/`maxAmount`: Amount range filtering
- `minProgress`/`maxProgress`: Progress range filtering

### Pagination & Sorting
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Sort field (createdAt, updatedAt, amount, progressPercentage, plannedDate, priority)
- `sortOrder`: ASC or DESC (default: DESC)

## Usage Examples

### Creating a Treatment Plan with Multiple Treatments

1. **Create the Treatment Plan:**
```javascript
const plan = await fetch('/treatments/plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: 'patient-uuid',
    name: 'Comprehensive Dental Treatment',
    diagnosis: 'Multiple cavities and gum disease',
    estimatedDurationWeeks: 12,
    totalAmount: 3000.00
  })
});
```

2. **Add Treatments to the Plan:**
```javascript
const treatments = [
  {
    patientId: 'patient-uuid',
    tenantTreatmentId: 'cleaning-uuid',
    treatmentPlanId: plan.id,
    amount: 150.00,
    priority: 'MEDIUM',
    plannedDate: '2024-01-15'
  },
  {
    patientId: 'patient-uuid',
    tenantTreatmentId: 'filling-uuid',
    treatmentPlanId: plan.id,
    amount: 200.00,
    priority: 'HIGH',
    plannedDate: '2024-01-22'
  }
];

for (const treatment of treatments) {
  await fetch('/treatments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(treatment)
  });
}
```

### Tracking Treatment Progress

```javascript
// Update progress during treatment
await fetch(`/treatments/${treatmentId}/progress?progressPercentage=75&progressNotes=Patient responding well to treatment`, {
  method: 'PATCH'
});

// Complete treatment
await fetch(`/treatments/${treatmentId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'COMPLETED',
    progressPercentage: 100,
    completedDate: new Date().toISOString().split('T')[0]
  })
});
```

### Getting Analytics

```javascript
// Get comprehensive statistics
const stats = await fetch('/treatments/statistics/treatments?startDate=2024-01-01&endDate=2024-12-31');

// Get patient treatment history
const patientHistory = await fetch('/treatments/patient/patient-uuid');

// Get upcoming treatments
const upcoming = await fetch('/treatments/upcoming?days=30');
```

## Database Schema

### Treatments Table
- Comprehensive treatment tracking with clinical and financial data
- Support for treatment plans and dependencies
- Progress tracking and status management
- Soft delete support

### Treatment Plans Table
- Multi-treatment plan management
- Auto-calculated progress and financial totals
- Timeline and duration tracking
- Soft delete support

### Indexes
- Optimized for common queries (patient, doctor, status, priority)
- Full-text search support for clinical notes
- Date range query optimization

## Integration Points

### Appointment Integration
- Treatments can be linked to appointments
- Automatic scheduling based on treatment plans
- Conflict detection with existing appointments

### Financial Integration
- Payment tracking and reconciliation
- Discount management
- Revenue reporting and analytics

### Patient Management
- Complete treatment history per patient
- Treatment plan tracking
- Progress monitoring

## Security & Permissions

- Tenant-based data isolation
- Role-based access control
- Audit trail for all changes
- Soft delete for data integrity

## Performance Considerations

- Efficient querying with proper indexing
- Pagination for large datasets
- Caching for frequently accessed data
- Optimized joins for related data

## Future Enhancements

- **Treatment Templates**: Predefined treatment templates
- **Automated Scheduling**: AI-powered treatment scheduling
- **Advanced Analytics**: Predictive analytics and insights
- **Mobile Integration**: Mobile app support
- **Third-party Integrations**: Insurance and payment gateway integration 