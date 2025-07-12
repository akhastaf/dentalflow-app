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
    OneToMany,
} from 'typeorm';
import { Patient } from '../../patient/entities/patient.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { PaymentStatus, PaymentMethod } from '../dtos/create-payment.dto';
import { PaymentTreatment } from './payment-treatment.entity';

@Entity('payments')
@Index('idx_payment_tenant_id', ['tenantId'])
@Index('idx_payment_patient_id', ['patientId'])
@Index('idx_payment_created_at', ['createdAt'])
@Index('idx_payment_status', ['status'])
@Index('idx_payment_method', ['paymentMethod'])
@Index(['tenantId', 'reference'], { unique: true }) // Optional: enforce uniqueness per tenant
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: false })
  isPartial: boolean;

  @Column({ 
    type: 'enum', 
    enum: PaymentStatus, 
    default: PaymentStatus.COMPLETED 
  })
  status: PaymentStatus;

  @Column({ 
    type: 'enum', 
    enum: PaymentMethod, 
    nullable: true 
  })
  paymentMethod?: PaymentMethod;

  @Column({ nullable: true })
  reference?: string; // Optional: e.g., receipt number

  @Column({ type: 'text', nullable: true })
  note?: string;

  // Relationship to payment treatments - tracks which treatments were paid and how much
  @OneToMany(() => PaymentTreatment, paymentTreatment => paymentTreatment.payment, {
    cascade: true,
    eager: false
  })
  paymentTreatments: PaymentTreatment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date; // Soft delete enabled
}
