import { Injectable } from '@nestjs/common';
import { defineAbilityFor, AppAbility } from './ability.factory';
import { User } from '../user/entities/user.entity';
import { Staff } from '../staff/entities/staff.entity';

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User, staff?: Staff): AppAbility {
    return defineAbilityFor(user, staff);
  }
} 