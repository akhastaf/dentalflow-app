import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum EmailTokenType {
    PASSWORD_RESET = 'PASSWORD_RESET',
    EMAIL_CONFIRMATION = 'EMAIL_CONFIRMATION'
}

@Entity('email_tokens')
export class EmailToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    token: string;

    @Column({
        type: 'enum',
        enum: EmailTokenType,
        default: EmailTokenType.PASSWORD_RESET
    })
    type: EmailTokenType;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    expiresAt: Date;

    @Column({ default: false })
    used: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    usedAt?: Date;

    /**
     * Check if the token is expired
     */
    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    /**
     * Check if the token is valid (not used and not expired)
     */
    isValid(): boolean {
        return !this.used && !this.isExpired();
    }

    /**
     * Mark token as used
     */
    markAsUsed(): void {
        this.used = true;
        this.usedAt = new Date();
    }
} 