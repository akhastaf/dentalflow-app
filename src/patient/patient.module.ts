import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { StaffModule } from '../staff/staff.module';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/user/users.module';
import { AbilityBuilder, Ability } from '@casl/ability';
import { Staff } from 'src/staff/entities/staff.entity';

export function defineAbilityFor(staff: Staff, rolePermissions: string[]) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  rolePermissions.forEach(perm => {
    if (perm === 'patient_read') can('read', 'Patient');
    if (perm === 'patient_write') can('create', 'Patient');
    // ...etc
  });

  return build();
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),
    StaffModule,
    JwtModule,
    UsersModule
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService]
})
export class PatientModule {}
