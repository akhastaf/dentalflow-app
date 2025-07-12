import { Patient } from '../../patient/entities/patient.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
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

export enum AttachmentType {
  IMAGE = 'image',
  PDF = 'pdf',
  DOC = 'doc',
  OTHER = 'other',
}

@Entity('attachments')
@Index('idx_attachment_tenant_id', ['tenantId'])
@Index('idx_attachment_patient_id', ['patientId'])
@Index('idx_attachment_type', ['type'])
export class Attachment {
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
  fileName: string;

  @Column()
  filePath: string; // local path or cloud storage URL

  @Column({ type: 'enum', enum: AttachmentType })
  type: AttachmentType;

  @Column({ type: 'bigint' })
  fileSize: number; // in bytes

  @Column({ nullable: true })
  uploadedById?: string; // optionally track user who uploaded it

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
