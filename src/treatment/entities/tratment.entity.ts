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
} from 'typeorm';
import { TenantTreatment } from './tenant-treatment.entity';

export enum TreatmentStatus {
  PLANNED = 'planned',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

@Entity('treatments')
@Index('idx_treatment_tenant_id', ['tenantId'])
@Index('idx_treatment_patient_id', ['patientId'])
@Index('idx_treatment_doctor_id', ['doctorId'])
@Index('idx_treatment_appointment_id', ['appointmentId'])
@Index('idx_treatment_status', ['status'])
@Index('idx_treatment_tooth_number', ['toothNumber'])
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

  @Column({ type: 'enum', enum: TreatmentStatus, default: TreatmentStatus.PLANNED })
  status: TreatmentStatus;

  @Column({ nullable: true })
  toothNumber?: string; // FDI format: e.g. "11", "36"

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'date', nullable: true })
  date?: Date;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date; // Soft delete enabled
}
