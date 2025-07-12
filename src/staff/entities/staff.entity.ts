import { Tenant } from '../../tenant/entities/tenant.entity';
import { User } from '../../user/entities/user.entity';
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
  OneToOne,
  OneToMany,
} from 'typeorm';
import { StaffTimeRange } from './staff-time-range.entity';

export enum StaffRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  ASSISTANT = 'assistant',
  RECEPTION = 'reception',
}

export enum SalaryType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

@Entity('staff')
@Index('idx_staff_tenant_id', ['tenantId'])
@Index(['tenantId', 'userId'], { unique: true }) // one staff config per user per tenant
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.staff)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.staffMemberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: false })
  isOwner: boolean;

  @Column('text', { array: true, default: () => 'ARRAY[]::text[]' })
  permissions: string[];

  @Column({ type: 'enum', enum: StaffRole })
  role: StaffRole;

  @Column({ type: 'int', array: true })
  workingDays: number[]; // [1, 2, 3, 4] (Mon–Thu)

  @Column({ type: 'enum', enum: SalaryType })
  salaryType: SalaryType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salaryAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => StaffTimeRange, timeRange => timeRange.staff)
  timeRanges: StaffTimeRange[];
}
