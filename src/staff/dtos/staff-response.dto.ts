import { ApiProperty } from '@nestjs/swagger';
import { StaffRole, SalaryType } from '../entities/staff.entity';

export class StaffResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', description: 'Unique identifier of the staff record' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ example: false, description: 'Indicates if the staff member is the owner' })
  isOwner: boolean;

  @ApiProperty({ enum: StaffRole, example: StaffRole.DOCTOR, description: 'Staff role' })
  role: StaffRole;

  @ApiProperty({ example: ['patient_read', 'patient_write'], description: 'Custom permissions for this staff member' })
  permissions: string[];

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: 'Working days (1=Monday, 2=Tuesday, etc.)' })
  workingDays: number[];

  @ApiProperty({ enum: SalaryType, example: SalaryType.FIXED, description: 'Type of salary calculation' })
  salaryType: SalaryType;

  @ApiProperty({ example: 5000.00, description: 'Salary amount' })
  salaryAmount: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Staff record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Staff record last update timestamp' })
  updatedAt: Date;
} 