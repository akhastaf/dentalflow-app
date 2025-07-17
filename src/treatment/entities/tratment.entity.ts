import { Appointment } from '../../appointment/entities/appointment.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { User } from '../../user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TenantTreatment } from './tenant-treatment.entity';
import { TreatmentPlan } from './treatment-plan.entity';

export enum TreatmentStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum TreatmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TreatmentPhase {
  DIAGNOSIS = 'diagnosis',
  TREATMENT_PLANNING = 'treatment_planning',
  TREATMENT_EXECUTION = 'treatment_execution',
  FOLLOW_UP = 'follow_up',
  MAINTENANCE = 'maintenance',
}

@Entity('treatments')
@Index('idx_treatment_tenant_id', ['tenantId'])
@Index('idx_treatment_patient_id', ['patientId'])
@Index('idx_treatment_doctor_id', ['doctorId'])
@Index('idx_treatment_appointment_id', ['appointmentId'])
@Index('idx_treatment_status', ['status'])
@Index('idx_treatment_tooth_number', ['toothNumber'])
@Index('idx_treatment_priority', ['priority'])
@Index('idx_treatment_phase', ['phase'])
@Index('idx_treatment_plan_id', ['treatmentPlanId'])
export class Treatment {
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

  @Column({ nullable: true })
  appointmentId?: string;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointmentId' })
  appointment?: Appointment;

  @Column()
  tenantTreatmentId: string;

  @ManyToOne(() => TenantTreatment)
  @JoinColumn({ name: 'tenantTreatmentId' })
  tenantTreatment: TenantTreatment;

  // Treatment Plan Management
  @Column({ nullable: true })
  treatmentPlanId?: string;

  @ManyToOne(() => TreatmentPlan, { nullable: true })
  @JoinColumn({ name: 'treatmentPlanId' })
  treatmentPlan?: TreatmentPlan;

  @Column({ nullable: true })
  parentTreatmentId?: string; // For dependent treatments

  @ManyToOne(() => Treatment, { nullable: true })
  @JoinColumn({ name: 'parentTreatmentId' })
  parentTreatment?: Treatment;

  @OneToMany(() => Treatment, treatment => treatment.parentTreatment)
  childTreatments?: Treatment[];

  // Status and Priority
  @Column({ type: 'enum', enum: TreatmentStatus, default: TreatmentStatus.PLANNED })
  status: TreatmentStatus;

  @Column({ type: 'enum', enum: TreatmentPriority, default: TreatmentPriority.MEDIUM })
  priority: TreatmentPriority;

  @Column({ type: 'enum', enum: TreatmentPhase, default: TreatmentPhase.TREATMENT_PLANNING })
  phase: TreatmentPhase;

  // Clinical Information
  @Column({ nullable: true })
  toothNumber?: string; // FDI format: e.g. "11", "36"

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  treatmentPlanDescription?: string;

  @Column({ type: 'text', nullable: true })
  clinicalNotes?: string;

  @Column({ type: 'text', nullable: true })
  postTreatmentInstructions?: string;

  // Financial Information
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  // Scheduling
  @Column({ type: 'date', nullable: true })
  plannedDate?: Date;

  @Column({ type: 'date', nullable: true })
  completedDate?: Date;

  @Column({ type: 'time', nullable: true })
  estimatedDuration?: string; // HH:MM format

  // Progress Tracking
  @Column({ type: 'int', default: 0 })
  progressPercentage: number; // 0-100

  @Column({ type: 'text', nullable: true })
  progressNotes?: string;

  // Quality and Follow-up
  @Column({ type: 'int', nullable: true })
  satisfactionRating?: number; // 1-5

  @Column({ type: 'text', nullable: true })
  followUpNotes?: string;

  @Column({ type: 'date', nullable: true })
  followUpDate?: Date;

  // Metadata
  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // For additional custom fields

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date; // Soft delete enabled
}
