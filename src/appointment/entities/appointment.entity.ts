import { Patient } from '../../patient/entities/patient.entity';
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
  Index,
  Unique,
  DeleteDateColumn,
} from 'typeorm';

@Entity('appointments')

// ✅ Prevent double-booking the same doctor at the same time in same tenant
@Unique('UQ_doctor_slot', ['tenantId', 'doctorId', 'date', 'startTime'])

// ✅ Indexes for performance on common queries
@Index('IDX_tenant', ['tenantId'])
@Index('IDX_doctor', ['doctorId'])
@Index('IDX_patient', ['patientId'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time', nullable: true })
  endTime: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'cancelled', 'no_show', 'finished', 'rescheduled'],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'finished' | 'rescheduled';

  @Column({
    type: 'enum',
    enum: ['staff', 'public_form', 'auto_from_treatment', 'referral'],
    default: 'staff',
  })
  createdVia: 'staff' | 'public_form' | 'auto_from_treatment' | 'referral';

  @Column({ type: 'text', nullable: true })
  notes: string;

  // 🔗 Relationships

  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  patientId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @Column({ nullable: true })
  doctorId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @ManyToOne(() => User, { nullable: true})
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  // 🔁 Recurring appointments
  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: 'text', nullable: true })
  recurrenceRule: string;

  @Column({ type: 'uuid', nullable: true })
  parentRecurringId: string;

  @Column({ type: 'date', nullable: true })
  recurrenceEndsAt: string;

  // 🔁 Rescheduled logic
  @Column({ type: 'uuid', nullable: true })
  rescheduledFromId: string;

  // 📅 Confirmation timestamps
  @Column({ type: 'timestamp', nullable: true })
  confirmationSentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  // 🕓 Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
