import { Appointment } from '../../appointment/entities/appointment.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Treatment } from '../../treatment/entities/tratment.entity';
import { User } from '../../user/entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';

export enum DocumentType {
  PRESCRIPTION = 'prescription',
  MEDICAL_NOTE = 'medical_note',
  INVOICE = 'invoice',
  CERTIFICATE = 'certificate',
  XRAY_REPORT = 'xray_report',
  TREATMENT_PLAN = 'treatment_plan',
  CONSENT_FORM = 'consent_form',
  OTHER = 'other',
}

@Entity('documents')
@Index('idx_document_tenant_id', ['tenantId'])
@Index('idx_document_patient_id', ['patientId'])
@Index('idx_document_type', ['type'])
@Index('idx_document_created_by', ['createdById'])
@Index('idx_document_assigned_doctor', ['assignedDoctorId'])
@Index('idx_document_status', ['status'])
export class Document {
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

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  assignedDoctorId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'assignedDoctorId' })
  assignedDoctor: Staff;

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'jsonb' })
  data: Record<string, any>; // Template-driven form values

  @Column({ default: 'draft' })
  status: 'draft' | 'finalized' | 'archived';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  /**
   * Get document filename for PDF generation
   */
  getFileName(): string {
    const date = this.createdAt.toISOString().split('T')[0];
    const patientName = this.patient?.fullName || 'Unknown';
    const type = this.type.replace('_', '-');
    return `${patientName}-${type}-${date}.pdf`;
  }

  /**
   * Get document template based on type
   */
  getTemplateName(): string {
    return `${this.type}_template`;
  }
}
