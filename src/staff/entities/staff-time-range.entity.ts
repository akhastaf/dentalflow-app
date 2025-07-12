import { Tenant } from '../../tenant/entities/tenant.entity';
import { Staff } from './staff.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum TimeRangeType {
  BREAK = 'break',
  VACATION = 'vacation',
  SICK_LEAVE = 'sick_leave',
  PERSONAL_TIME = 'personal_time',
  LUNCH = 'lunch',
  OTHER = 'other',
}

export enum TimeRangeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('staff_time_ranges')
@Index('idx_staff_time_range_staff_id', ['staffId'])
@Index('idx_staff_time_range_tenant_id', ['tenantId'])
@Index('idx_staff_time_range_date_range', ['startDate', 'endDate'])
export class StaffTimeRange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.staffTimeRanges)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  staffId: string;

  @ManyToOne(() => Staff, staff => staff.timeRanges)
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column({ type: 'enum', enum: TimeRangeType })
  type: TimeRangeType;

  @Column({ type: 'enum', enum: TimeRangeStatus, default: TimeRangeStatus.APPROVED })
  status: TimeRangeStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'time', nullable: true })
  startTime?: string; // Format: HH:MM (e.g., "09:00")

  @Column({ type: 'time', nullable: true })
  endTime?: string; // Format: HH:MM (e.g., "17:00")

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'int', array: true, nullable: true })
  recurringDays?: number[]; // [1, 2, 3, 4, 5] for Mon-Fri

  @Column({ type: 'date', nullable: true })
  recurringEndDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
} 