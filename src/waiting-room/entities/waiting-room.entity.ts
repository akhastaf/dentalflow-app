import { Patient } from '../../patient/entities/patient.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Staff } from '../../staff/entities/staff.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum WaitingRoomStatus {
  WAITING = 'waiting',
  CALLED = 'called',
  IN_CONSULTATION = 'in_consultation',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum EmergencyLevel {
  NORMAL = 'normal',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

@Entity('waiting_room')
@Index('idx_waiting_room_tenant_id', ['tenantId'])
@Index('idx_waiting_room_patient_id', ['patientId'])
@Index('idx_waiting_room_status', ['status'])
@Index('idx_waiting_room_emergency_level', ['emergencyLevel'])
@Index('idx_waiting_room_order', ['order'])
@Index('idx_waiting_room_deleted_at', ['deletedAt'])
@Index(['tenantId', 'order'], { unique: true }) // Unique order per tenant
export class WaitingRoom {
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
  assignedDoctorId?: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'assignedDoctorId' })
  assignedDoctor: Staff;

  @Column({ type: 'enum', enum: WaitingRoomStatus, default: WaitingRoomStatus.WAITING })
  status: WaitingRoomStatus;

  @Column({ type: 'enum', enum: EmergencyLevel, default: EmergencyLevel.NORMAL })
  emergencyLevel: EmergencyLevel;

  @Column({ type: 'int' })
  order: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  calledBy?: string; // Staff ID who called the patient

  @Column({ type: 'timestamp', nullable: true })
  calledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  consultationStartedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  consultationEndedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  cancelledBy?: string; // Staff ID who cancelled

  @Column({ nullable: true })
  cancellationReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
} 