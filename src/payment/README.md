# Payment Module

A comprehensive payment management system for dental cabinet management SaaS with treatment-focused payment tracking and soft delete functionality.

## Features

- ✅ **CRUD Operations**: Create, Read, Update, Delete payments
- 🔍 **Advanced Filtering**: Filter by patient, tenant, status, method, amount range, date range
- 📊 **Payment Statistics**: Get detailed payment analytics and reports
- 💳 **Multiple Payment Methods**: Cash, Card, Bank Transfer, Check, Insurance, Other
- 📈 **Payment Status Tracking**: Pending, Completed, Failed, Cancelled, Refunded
- 🔢 **Auto Reference Generation**: Automatic payment reference number generation
- 🏥 **Treatment-Focused**: Direct payment tracking for dental treatments
- 🗑️ **Soft Delete**: Safe deletion with restore capability
- 💰 **Partial Payments**: Support for partial payments on treatments
- 📋 **Audit Trail**: Complete payment history preservation

## Entity Structure

```typescript
Payment {
  id: string (UUID)
  patientId: string
  tenantId: string
  amount: number (decimal) // Total payment amount
  isPartial: boolean
  status: PaymentStatus
  paymentMethod?: PaymentMethod
  reference?: string
  note?: string // Payment-level note
  paymentTreatments: PaymentTreatment[] // Explicit treatment payments
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date // Soft delete timestamp
}

PaymentTreatment {
  id: string (UUID)
  paymentId: string
  treatmentId: string
  treatment: Treatment // Relationship to treatment
  amountPaid: number (decimal) // Explicit amount paid for this treatment
  createdAt: Date
  deletedAt?: Date // Soft delete timestamp
}
```

## Payment Workflow

1. **Select Treatments**: Choose specific treatments to pay
2. **Specify Amounts**: Explicitly state how much to pay for each treatment
3. **Validate Payment**: System validates total payment matches sum of treatment payments
4. **Update Treatment Status**: Treatments are marked as `DONE` when fully paid
5. **Audit Trail**: Complete record of what was paid for each treatment

## Payment Status

- `PENDING` - Payment is pending
- `COMPLETED` - Payment completed successfully
- `FAILED` - Payment failed
- `CANCELLED` - Payment was cancelled
- `REFUNDED` - Payment was refunded

## Payment Methods

- `CASH` - Cash payment
- `CARD` - Credit/Debit card
- `BANK_TRANSFER` - Bank transfer
- `CHECK` - Check payment
- `INSURANCE` - Insurance payment
- `OTHER` - Other payment methods

## API Endpoints

### Create Payment
```http
POST /api/v1/payments
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "tenantId": "uuid",
  "amount": 450.00, // Total payment amount
  "isPartial": false,
  "paymentMethod": "CASH",
  "status": "COMPLETED",
  "reference": "PAY-123456", // optional, auto-generated if not provided
  "note": "Payment for dental treatments",
  "paymentTreatments": [
    {
      "treatmentId": "uuid-1",
      "amountPaid": 200.00
    },
    {
      "treatmentId": "uuid-2", 
      "amountPaid": 250.00
    }
  ]
}
```

**Validation:**
- Total payment amount must equal sum of treatment payments
- Payment amounts cannot exceed remaining treatment amounts
- All treatments must belong to the same patient

### Get Payment by ID
```http
GET /api/v1/payments/:id
```

### List Payments with Filters
```http
GET /api/v1/payments?tenantId=uuid&patientId=uuid&status=COMPLETED&minAmount=100&maxAmount=500&includeDeleted=false
```

**Query Parameters:**
- `tenantId` - Filter by tenant
- `patientId` - Filter by patient
- `status` - Filter by payment status
- `paymentMethod` - Filter by payment method
- `isPartial` - Filter partial payments
- `minAmount` - Minimum amount filter
- `maxAmount` - Maximum amount filter
- `dateFrom` - Start date (YYYY-MM-DD)
- `dateTo` - End date (YYYY-MM-DD)
- `reference` - Search by reference number
- `treatmentId` - Filter by treatment (searches in payment treatments)
- `includeDeleted` - Include soft-deleted payments (default: false)

### Update Payment
```http
PATCH /api/v1/payments/:id
```

### Update Payment Status
```http
PATCH /api/v1/payments/:id/status
```

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

### Get Available Treatments for Payment
```http
GET /api/v1/payments/available-treatments/:patientId/:tenantId
```

### Get Payment Statistics
```http
GET /api/v1/payments/stats/:tenantId?dateFrom=2024-01-01&dateTo=2024-12-31
```

**Response:**
```json
{
  "totalAmount": 15000.00,
  "paymentCount": 75,
  "byMethod": {
    "CASH": 6750.00,
    "CARD": 4500.00,
    "BANK_TRANSFER": 3750.00
  },
  "averageAmount": 200.00
}
```

### Soft Delete Payment
```http
DELETE /api/v1/payments/:id
```
- Sets `deletedAt` timestamp
- Payment remains in database
- Won't appear in normal queries
- Can be restored later

### Restore Soft-Deleted Payment
```http
PATCH /api/v1/payments/:id/restore
```
- Clears `deletedAt` field
- Payment becomes active again

### Permanent Delete Payment (Use with Caution)
```http
DELETE /api/v1/payments/:id/permanent
```
- Actually removes from database
- Cannot be restored
- Use only when absolutely necessary

### Get Deleted Payments
```http
GET /api/v1/payments/deleted?tenantId=uuid
```
- Shows only soft-deleted payments
- Optional tenant filtering

## Usage Examples

### Create a Payment with Explicit Treatment Amounts
```typescript
const payment = await paymentService.create({
  patientId: 'patient-uuid',
  tenantId: 'tenant-uuid',
  amount: 450.00, // Total payment amount
  paymentMethod: PaymentMethod.CARD,
  status: PaymentStatus.COMPLETED,
  note: 'Payment for dental treatments',
  paymentTreatments: [
    {
      treatmentId: 'treatment-uuid-1',
      amountPaid: 200.00 // Pay $200 towards treatment 1
    },
    {
      treatmentId: 'treatment-uuid-2',
      amountPaid: 250.00 // Pay $250 towards treatment 2
    }
  ]
});

// System will automatically:
// 1. Validate total amount (450) matches sum of treatment payments (200 + 250)
// 2. Check that payment amounts don't exceed remaining treatment amounts
// 3. Update treatment.amountPaid for each treatment
// 4. Mark treatments as DONE if fully paid
// 5. Create payment treatment records
```

### Partial Payment Example
```typescript
// Treatment costs $500, patient pays $300 now
const partialPayment = await paymentService.create({
  patientId: 'patient-uuid',
  tenantId: 'tenant-uuid',
  amount: 300.00,
  isPartial: true,
  paymentMethod: PaymentMethod.CASH,
  paymentTreatments: [
    {
      treatmentId: 'treatment-uuid',
      amountPaid: 300.00 // $300 paid, $200 remaining
    }
  ]
});
```

### Get Deleted Payments
```typescript
// Get all soft-deleted payments for a tenant
const deletedPayments = await paymentService.getDeletedPayments('tenant-uuid');

// Restore a deleted payment
const restoredPayment = await paymentService.restore('payment-uuid');
```

## Soft Delete Benefits

1. **Audit Trail**: All payment history is preserved
2. **Compliance**: Financial records are never lost
3. **Recovery**: Accidental deletions can be undone
4. **Reporting**: Can still generate reports on deleted payments
5. **Data Integrity**: Maintains referential integrity

## Treatment Payment Logic

The system ensures:
- ✅ Payment amounts match the sum of treatment payments
- ✅ Payment amounts don't exceed remaining treatment amounts
- ✅ Treatments are updated with new `amountPaid` values
- ✅ Treatment status is updated to `DONE` when fully paid
- ✅ Complete audit trail of what was paid for each treatment

## Database Schema

```sql
-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_partial BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'completed',
  payment_method VARCHAR(20),
  reference VARCHAR(255),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Payment treatments table
CREATE TABLE payment_treatments (
  id UUID PRIMARY KEY,
  payment_id UUID NOT NULL,
  treatment_id UUID NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);
```

## Error Handling

The system provides comprehensive error handling:
- **Validation Errors**: Payment amounts must match treatment payments
- **Business Logic Errors**: Cannot pay more than remaining treatment amount
- **Not Found Errors**: Treatments and payments must exist
- **Soft Delete Errors**: Cannot restore non-deleted payments 