import { Entity, Index, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('treatment_references')
@Index('idx_treatment_ref_code', ['code'], { unique: true })
@Index('idx_treatment_ref_category', ['category'])
@Index('idx_treatment_ref_name', ['name'])
export class TreatmentReference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  defaultPrice: number;

  @Column()
  defaultColor: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
