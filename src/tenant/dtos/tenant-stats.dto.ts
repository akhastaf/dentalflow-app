import { ApiProperty } from '@nestjs/swagger';

export class TenantStatsDto {
  @ApiProperty({ description: 'Total number of patients', example: 150 })
  totalPatients: number;

  @ApiProperty({ description: 'Total number of appointments', example: 450 })
  totalAppointments: number;

  @ApiProperty({ description: 'Appointments this month', example: 45 })
  appointmentsThisMonth: number;

  @ApiProperty({ description: 'Total revenue', example: 50000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Revenue this month', example: 8500 })
  revenueThisMonth: number;

  @ApiProperty({ description: 'Active staff members', example: 8 })
  activeStaff: number;

  @ApiProperty({ description: 'Pending appointments', example: 12 })
  pendingAppointments: number;

  @ApiProperty({ description: 'Completed appointments today', example: 5 })
  completedToday: number;

  @ApiProperty({ description: 'Upcoming appointments today', example: 3 })
  upcomingToday: number;
} 