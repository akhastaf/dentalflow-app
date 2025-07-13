import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from "typeorm";
import * as bcrypt from "bcryptjs"
import { BadRequestException } from "@nestjs/common";
import { Exclude } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Staff } from "../../staff/entities/staff.entity";

// 2FA Methods enum
export enum TwoFactorMethod {
  NONE = 'none',
  EMAIL = 'email',
  AUTHENTICATOR = 'authenticator',
}

// Login activity interface
export interface LoginActivity {
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
}

@Entity('users')
export class User {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', description: 'Unique identifier of the user' })
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User\'s email address' })
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ default: false })
  isPlatformAdmin: boolean;

  @OneToMany(() => Staff, staff => staff.user)
  staffMemberships: Staff[];

  @Exclude() // Exclude password from all responses by default
  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @ApiProperty({ example: 'John', description: 'User\'s first name' })
  @Column({ type: 'varchar', length: 100, nullable: false })
  first_name: string;

  @ApiProperty({ example: 'Doe', description: 'User\'s last name' })
  @Column({ type: 'varchar', length: 100, nullable: false })
  last_name: string;

  @Exclude()
  @Column({ type: 'boolean', nullable: false, default: false })
  is_verified: boolean;

  // 🔐 2FA Fields
  @Exclude()
  @Column({ 
    type: 'enum', 
    enum: TwoFactorMethod, 
    default: TwoFactorMethod.NONE 
  })
  twoFactorMethod: TwoFactorMethod;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret?: string; // For authenticator apps

  @Exclude()
  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  twoFactorBackupCodes?: string; // JSON array of backup codes

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  twoFactorVerifiedAt?: Date;

  // 📧 Email verification
  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationExpiresAt?: Date;

  // 🔄 Password reset
  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken?: string;

  @Exclude()
  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpiresAt?: Date;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  hashed_refresh_token?: string;

  // ⚙️ User Preferences/Settings (JSON)
  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    language?: string;
    timezone?: string;
    theme?: 'light' | 'dark' | 'auto';
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    dashboard?: {
      defaultView?: string;
      widgets?: string[];
    };
    privacy?: {
      profileVisibility?: 'public' | 'private' | 'staff_only';
      activityVisibility?: 'public' | 'private' | 'staff_only';
    };
  };

  // 📊 Activity Tracking
  @ApiProperty({ description: 'Timestamp of the last login' })
  @Column({ type: 'timestamptz', nullable: true })
  last_login: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp?: string; // IPv4 or IPv6

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastLoginUserAgent?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastLoginLocation?: string; // City, Country

  @Column({ type: 'int', default: 0 })
  loginCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastActivityAt?: Date;

  // 📈 Login History (last 10 logins)
  @Column({ type: 'jsonb', nullable: true })
  loginHistory?: LoginActivity[];

  // 🔒 Security
  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil?: Date;

  @Column({ type: 'boolean', default: false })
  requirePasswordChange: boolean;

  @ApiProperty({ example: true, description: 'Indicates if the user account is active' })
  @Column({ type: 'boolean', nullable: false, default: true })
  is_active: boolean;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    if (!password || !this.password) {
      return false;
    }
    return bcrypt.compare(password, this.password);
  }

  async hashRefreshToken(refreshToken: string): Promise<string> {
      return bcrypt.hash(refreshToken, 10);
  }

  // 🔐 2FA Methods
  async verifyTwoFactorCode(code: string): Promise<boolean> {
    if (!this.twoFactorSecret || this.twoFactorMethod === TwoFactorMethod.NONE) {
      return false;
    }
    
    // For authenticator apps, you'd use a library like 'speakeasy'
    // For email, you'd compare with a stored temporary code
    return true; // Placeholder
  }

  // 📊 Activity Methods
  recordLoginActivity(ipAddress: string, userAgent: string, success: boolean, location?: string): void {
    const activity: LoginActivity = {
      timestamp: new Date(),
      ipAddress,
      userAgent,
      location,
      success
    };

    if (!this.loginHistory) {
      this.loginHistory = [];
    }

    // Keep only last 10 logins
    this.loginHistory = [activity, ...this.loginHistory.slice(0, 9)];
    
    this.last_login = new Date();
    this.lastLoginIp = ipAddress;
    this.lastLoginUserAgent = userAgent;
    this.lastLoginLocation = location;
    this.lastActivityAt = new Date();
    
    if (success) {
      this.loginCount++;
      this.failedLoginAttempts = 0;
    } else {
      this.failedLoginAttempts++;
    }
  }

  isAccountLocked(): boolean {
    return this.lockedUntil ? new Date() < this.lockedUntil : false;
  }

  lockAccount(minutes: number = 15): void {
    this.lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
  }

  unlockAccount(): void {
    this.lockedUntil = undefined;
    this.failedLoginAttempts = 0;
  }
}