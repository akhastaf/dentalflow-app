import { Appointment } from '../../appointment/entities/appointment.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { Document } from '../../document/entities/document.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Treatment } from '../../treatment/entities/tratment.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

@Entity('patients')
@Index('idx_patient_tenant_id', ['tenantId'])
@Index('idx_patient_full_name', ['fullName'])
@Index('idx_patient_deleted_at', ['deletedAt'])
@Index(['tenantId', 'phone'], { unique: true }) // Unique per clinic
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ nullable: true })
  emergencyContactName?: string;

  @Column({ nullable: true })
  emergencyContactRelationship?: string;

  @Column({ nullable: true })
  emergencyContactPhone?: string;

  @Column({ nullable: true })
  emergencyContactAddress?: string;

  @Column({ nullable: true })
  insuranceProvider?: string;

  @Column({ nullable: true })
  insuranceNumber?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  medicalHistories?: any;

  @Column({ type: 'json', nullable: true })
  allergies?: any;

  @Column({ type: 'json', nullable: true })
  previousDentalHistory?: any;

  @Column({ type: 'boolean', nullable: true })
  isPregnant?: boolean;

  @Column({ type: 'int', nullable: true })
  pregnancyMonth?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relationships
  @OneToMany(() => Appointment, (appt) => appt.patient)
  appointments: Appointment[];

  @OneToMany(() => Document, (doc) => doc.patient)
  documents: Document[];

  @OneToMany(() => Attachment, (file) => file.patient)
  attachments: Attachment[];

  @OneToMany(() => Treatment, (treatment) => treatment.patient)
  treatments: Treatment[];
}
