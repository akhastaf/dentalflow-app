import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { Treatment } from '../../treatment/entities/tratment.entity';

@Entity('payment_treatments')
export class PaymentTreatment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  paymentId: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column()
  treatmentId: string;

  @ManyToOne(() => Treatment)
  @JoinColumn({ name: 'treatmentId' })
  treatment: Treatment;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountPaid: number; // Amount paid for this specific treatment

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date; // Soft delete enabled
} 