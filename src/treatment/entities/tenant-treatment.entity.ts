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
import { Tenant } from '../../tenant/entities/tenant.entity';
import { TreatmentReference } from './treatment-ref.entity';

@Entity('tenant_treatments')
@Index(['tenantId', 'code'], { unique: true })
@Index('idx_tenant_treatments_tenant_id', ['tenantId'])
@Index('idx_tenant_treatments_is_active', ['isActive'])
@Index('idx_tenant_treatments_deleted_at', ['deletedAt'])
@Index('idx_tenant_treatments_ref_id', ['treatmentRefId'])
@Index('idx_tenant_treatments_name', ['name'])
// @Index('idx_tenant_treatments_searchable', ['searchableText'])
export class TenantTreatment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  treatmentRefId?: string;

  @ManyToOne(() => TreatmentReference, { nullable: true })
  @JoinColumn({ name: 'treatmentRefId' })
  treatmentRef?: TreatmentReference;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isCustom: boolean;

//   @Column({ type: 'text', default: '' })
//   searchableText: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
