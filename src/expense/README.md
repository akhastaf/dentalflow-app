# Expenses Module

A comprehensive expense management system for dental clinics, supporting various expense types, recurring expenses, loan repayments, and soft delete functionality.

## Features

- ✅ **Complete CRUD Operations** - Create, read, update, and delete expenses
- 🗑️ **Soft Delete** - Safely delete expenses with restoration capability
- 📊 **Advanced Filtering** - Filter by category, status, date range, amount, etc.
- 📈 **Statistics & Analytics** - Get expense summaries and breakdowns
- 🔄 **Recurring Expenses** - Support for recurring expense tracking
- 💰 **Loan Repayments** - Track loan repayments separately
- 📁 **File Attachments** - Support for receipt/file attachments
- 🏷️ **Multiple Categories** - Predefined expense categories with custom labels
- 💳 **Payment Methods** - Track different payment methods used
- 📅 **Date Management** - Track expense dates and payment dates

## Database Schema

### Expense Entity

```typescript
@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category: ExpenseCategory;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ nullable: true })
  supplier?: string;

  @Column({ nullable: true })
  reference?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status: ExpenseStatus;

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: 'enum', enum: RecurrenceFrequency, nullable: true })
  recurrenceFrequency?: RecurrenceFrequency;

  @Column({ type: 'date', nullable: true })
  recurrenceEndDate?: Date;

  @Column({ default: false })
  isLoanRepayment: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  loanAmount?: number;

  @Column({ type: 'int', nullable: true })
  loanMonths?: number;

  @Column({ nullable: true })
  attachmentPath?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

### Enums

```typescript
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK = 'bank',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

export enum ExpenseCategory {
  RENT = 'rent',
  SALARY = 'salary',
  SUPPLIES = 'supplies',
  ELECTRICITY = 'electricity',
  INTERNET = 'internet',
  MAINTENANCE = 'maintenance',
  EQUIPMENT = 'equipment',
  LOAN_REPAYMENT = 'loan_repayment',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  PENDING = 'pending',
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}
```

## API Endpoints

### Core CRUD Operations

#### Create Expense
```http
POST /expenses
Content-Type: application/json

{
  "tenantId": "uuid",
  "category": "equipment",
  "expenseDate": "2024-01-15",
  "supplier": "DentalPro Inc.",
  "reference": "INV-001",
  "totalAmount": 15000.00,
  "amountPaid": 15000.00,
  "paymentMethod": "bank",
  "isRecurring": false,
  "isLoanRepayment": false
}
```

#### Get Expense by ID
```http
GET /expenses/:id
GET /expenses/:id?includeDeleted=true
```

#### Get All Expenses (with filters)
```http
GET /expenses?tenantId=uuid&category=equipment&status=paid&dateFrom=2024-01-01&dateTo=2024-12-31
```

#### Update Expense
```http
PUT /expenses/:id
Content-Type: application/json

{
  "totalAmount": 16000.00,
  "amountPaid": 16000.00,
  "status": "paid"
}
```

#### Update Expense Status
```http
PUT /expenses/:id/status
Content-Type: application/json

{
  "status": "paid"
}
```

### Soft Delete Operations

#### Soft Delete Expense
```http
DELETE /expenses/:id
```

#### Get Deleted Expenses
```http
GET /expenses/deleted/list?tenantId=uuid
```

#### Restore Deleted Expense
```http
PUT /expenses/:id/restore
```

#### Permanent Delete (use with caution)
```http
DELETE /expenses/:id/permanent
```

### Statistics & Analytics

#### Get Expense Statistics
```http
GET /expenses/stats/summary?tenantId=uuid&dateFrom=2024-01-01&dateTo=2024-12-31
```

Response:
```json
{
  "totalAmount": 50000.00,
  "totalPaid": 45000.00,
  "totalUnpaid": 5000.00,
  "expenseCount": 25,
  "byCategory": {
    "equipment": { "total": 20000.00, "count": 5, "paid": 18000.00 },
    "supplies": { "total": 15000.00, "count": 20, "paid": 15000.00 }
  },
  "byStatus": {
    "paid": { "total": 45000.00, "count": 22 },
    "pending": { "total": 5000.00, "count": 3 }
  },
  "byPaymentMethod": {
    "bank": { "total": 30000.00, "count": 15 },
    "card": { "total": 20000.00, "count": 10 }
  },
  "averageAmount": 2000.00,
  "paidPercentage": 90.0
}
```

### Reference Data

#### Get Expense Categories
```http
GET /expenses/categories/list
```

#### Get Payment Methods
```http
GET /expenses/payment-methods/list
```

#### Get Recurrence Frequencies
```http
GET /expenses/recurrence-frequencies/list
```

## Business Logic

### Status Determination

The system automatically determines expense status based on payment amounts:

- **PENDING**: No amount paid
- **PARTIALLY_PAID**: Some amount paid but less than total
- **PAID**: Amount paid equals or exceeds total amount

### Special Expense Types

#### Recurring Expenses
- Marked with `isRecurring: true`
- Can specify `recurrenceFrequency` and `recurrenceEndDate`
- Typically marked as PAID status

#### Loan Repayments
- Marked with `isLoanRepayment: true`
- Can specify `loanAmount` and `loanMonths`
- Typically marked as PAID status

### Validation Rules

1. **Amount Validation**: Paid amount cannot exceed total amount
2. **Required Fields**: `tenantId`, `category`, `expenseDate`, `totalAmount`
3. **Date Validation**: All dates must be valid ISO date strings
4. **Enum Validation**: All enum fields must use valid enum values

## Usage Examples

### Creating a Regular Expense
```typescript
const expense = await expensesService.create({
  tenantId: 'tenant-uuid',
  category: ExpenseCategory.EQUIPMENT,
  expenseDate: '2024-01-15',
  supplier: 'DentalPro Inc.',
  reference: 'INV-001',
  totalAmount: 15000.00,
  amountPaid: 15000.00,
  paymentMethod: PaymentMethod.BANK,
  status: ExpenseStatus.PAID
});
```

### Creating a Recurring Expense
```typescript
const recurringExpense = await expensesService.create({
  tenantId: 'tenant-uuid',
  category: ExpenseCategory.RENT,
  expenseDate: '2024-01-01',
  supplier: 'City Real Estate',
  reference: 'RENT-0124',
  totalAmount: 3000.00,
  amountPaid: 3000.00,
  paymentMethod: PaymentMethod.CHEQUE,
  isRecurring: true,
  recurrenceFrequency: RecurrenceFrequency.MONTHLY,
  recurrenceEndDate: '2024-12-31'
});
```

### Creating a Loan Repayment
```typescript
const loanRepayment = await expensesService.create({
  tenantId: 'tenant-uuid',
  category: ExpenseCategory.LOAN_REPAYMENT,
  expenseDate: '2024-01-15',
  supplier: 'Bank of Health',
  reference: 'LOAN-EQ-987',
  totalAmount: 1200.00,
  amountPaid: 1200.00,
  paymentMethod: PaymentMethod.BANK,
  isLoanRepayment: true,
  loanAmount: 50000.00,
  loanMonths: 48
});
```

### Filtering Expenses
```typescript
const filters: FilterExpenseDto = {
  tenantId: 'tenant-uuid',
  categories: [ExpenseCategory.EQUIPMENT, ExpenseCategory.SUPPLIES],
  statuses: [ExpenseStatus.PAID, ExpenseStatus.PARTIALLY_PAID],
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  minAmount: 1000,
  maxAmount: 20000,
  keyword: 'DentalPro'
};

const expenses = await expensesService.findAll(filters);
```

### Getting Statistics
```typescript
const stats = await expensesService.getExpenseStats(
  'tenant-uuid',
  '2024-01-01',
  '2024-12-31'
);

console.log(`Total Expenses: $${stats.totalAmount}`);
console.log(`Paid: $${stats.totalPaid}`);
console.log(`Unpaid: $${stats.totalUnpaid}`);
console.log(`Count: ${stats.expenseCount}`);
```

## Error Handling

The service includes comprehensive error handling:

- **NotFoundException**: When expense is not found
- **BadRequestException**: When validation fails (e.g., paid amount > total amount)
- **Validation Errors**: Automatic validation using class-validator decorators

## Soft Delete Implementation

The module implements soft delete functionality:

1. **Soft Delete**: Uses TypeORM's `softRemove()` to mark records as deleted
2. **Restore**: Uses TypeORM's `restore()` to unmark deleted records
3. **Permanent Delete**: Uses TypeORM's `remove()` for permanent deletion
4. **Include Deleted**: Query parameter to include soft-deleted records in results

## Dependencies

- **@nestjs/common**: Core NestJS functionality
- **@nestjs/typeorm**: TypeORM integration
- **@nestjs/swagger**: API documentation
- **class-validator**: Input validation
- **class-transformer**: Data transformation

## Testing

The module includes comprehensive test coverage:

- Unit tests for service methods
- Integration tests for controller endpoints
- Validation tests for DTOs
- Error handling tests

## Migration Notes

When upgrading from previous versions:

1. **Database Migration**: Ensure the `expenses` table has all required columns
2. **Enum Updates**: Update any hardcoded enum values to match new enum definitions
3. **Soft Delete**: Existing records will have `deletedAt: null`
4. **Indexes**: Ensure database indexes are created for performance

## Performance Considerations

- **Indexes**: Database indexes on `tenantId`, `expenseDate`, `category`
- **Pagination**: Consider implementing pagination for large datasets
- **Caching**: Consider caching for frequently accessed statistics
- **Query Optimization**: Use specific filters to reduce query scope 