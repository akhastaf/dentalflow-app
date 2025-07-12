import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty()
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ example: '2025-07-05' })
  @IsDateString()
  newDate: string;

  @ApiProperty({ example: '11:00:00' })
  // @IsDateString()
  newStartTime: string;

  @ApiPropertyOptional({ example: '11:30:00' })
  // @IsDateString()
  @IsOptional()
  newEndTime?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  doctorId?: string;
}
