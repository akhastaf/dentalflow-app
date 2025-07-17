import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { User } from '../../user/entities/user.entity';
import { Treatment } from './tratment.entity';

export enum TreatmentPlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum TreatmentPlanPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('treatment_plans')
@Index('idx_treatment_plan_tenant_id', ['tenantId'])
@Index('idx_treatment_plan_patient_id', ['patientId'])
@Index('idx_treatment_plan_doctor_id', ['doctorId'])
@Index('idx_treatment_plan_status', ['status'])
@Index('idx_treatment_plan_priority', ['priority'])
export class TreatmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  doctorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor?: User;

  // Basic Information
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TreatmentPlanStatus, default: TreatmentPlanStatus.DRAFT })
  status: TreatmentPlanStatus;

  @Column({ type: 'enum', enum: TreatmentPlanPriority, default: TreatmentPlanPriority.MEDIUM })
  priority: TreatmentPlanPriority;

  // Clinical Information
  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  treatmentGoals?: string;

  @Column({ type: 'text', nullable: true })
  clinicalNotes?: string;

  @Column({ type: 'text', nullable: true })
  contraindications?: string;

  // Financial Information
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDiscountAmount: number;

  // Timeline
  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  estimatedEndDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualEndDate?: Date;

  @Column({ type: 'int', default: 0 })
  estimatedDurationWeeks: number;

  // Progress Tracking
  @Column({ type: 'int', default: 0 })
  progressPercentage: number; // 0-100

  @Column({ type: 'int', default: 0 })
  completedTreatmentsCount: number;

  @Column({ type: 'int', default: 0 })
  totalTreatmentsCount: number;

  // Quality and Follow-up
  @Column({ type: 'int', nullable: true })
  satisfactionRating?: number; // 1-5

  @Column({ type: 'text', nullable: true })
  followUpNotes?: string;

  @Column({ type: 'date', nullable: true })
  followUpDate?: Date;

  // Metadata
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // For additional custom fields

  // Relationships
  @OneToMany(() => Treatment, treatment => treatment.treatmentPlanId)
  treatments?: Treatment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date; // Soft delete enabled
} 