import { Appointment } from '../../appointment/entities/appointment.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { User } from '../../user/entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { StaffTimeRange } from '../../staff/entities/staff-time-range.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum Language {
  FR = 'fr',
  AR = 'ar',
  EN = 'en',
}

@Entity('tenants')
// Unique constraints
@Index('UQ_tenant_slug', ['slug'], { unique: true })
@Index('UQ_tenant_name', ['name'], { unique: true })
@Index('UQ_tenant_email', ['email'], { unique: true })

// Performance indexes
@Index('IDX_tenant_subscription', ['subscriptionPlan'])
@Index('IDX_tenant_is_active', ['isActive'])
@Index('IDX_tenant_deleted_at', ['deletedAt'])
@Index('IDX_tenant_city', ['city'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  slug: string; // Used for URL routing like /tenant/:slug

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  email: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 100 })
  city: string;

  // Logo for app/UI display
  @Column({ nullable: true, length: 500 })
  logoUrl?: string;

  // Document generation images
  @Column({ nullable: true, length: 500 })
  headerImageUrl?: string; // For document headers

  @Column({ nullable: true, length: 500 })
  watermarkImageUrl?: string; // For document watermarks

  @Column({ 
    type: 'enum', 
    enum: SubscriptionPlan, 
    default: SubscriptionPlan.FREE 
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ default: true })
  isActive: boolean;

  @Column({ 
    type: 'enum', 
    enum: Language, 
    nullable: true,
    default: Language.FR 
  })
  language?: Language;

  @Column({ 
    length: 50, 
    nullable: true,
    default: 'Africa/Casablanca' 
  })
  timezone?: string;



  // Owner/Admin reference
  @Column({ nullable: true })
  ownerUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerUserId' })
  owner?: User;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relationships
//   @OneToMany(() => User, (user) => user.tenant)
//   users: User[];

//   @OneToMany(() => Patient, (patient) => patient.tenant)
//   patients: Patient[];

  @OneToMany(() => Appointment, (appointment) => appointment.tenant)
  appointments: Appointment[];

  @OneToMany(() => Staff, staff => staff.tenant)
  staff: Staff[];

  @OneToMany(() => StaffTimeRange, timeRange => timeRange.tenant)
  staffTimeRanges: StaffTimeRange[];

//   @OneToMany(() => Document, (document) => document.tenant)
//   documents: Document[];

//   @OneToMany(() => Attachment, (attachment) => attachment.tenant)
//   attachments: Attachment[];

  // Add these if you implement these modules
  // @OneToMany(() => Treatment, (treatment) => treatment.tenant)
  // treatments: Treatment[];

  // @OneToMany(() => Invoice, (invoice) => invoice.tenant)
  // invoices: Invoice[];

  // @OneToMany(() => WaitingRoom, (waitingRoom) => waitingRoom.tenant)
  // waitingRoomEntries: WaitingRoom[];
}