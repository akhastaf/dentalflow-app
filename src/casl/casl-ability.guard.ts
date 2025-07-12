import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_ABILITY, RequiredRule } from './casl.decorators';
import { User } from '../user/entities/user.entity';
import { Staff } from '../staff/entities/staff.entity';
import { Actions, Subjects } from './ability.factory';

@Injectable()
export class CaslAbilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRules = this.reflector.getAllAndOverride<RequiredRule[]>(CHECK_ABILITY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRules) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const staff = request.staff as Staff; // Attach this in middleware

    const ability = this.caslAbilityFactory.createForUser(user, staff);

    for (const rule of requiredRules) {
      if (!ability.can(rule.action as Actions, rule.subject as Subjects)) {
        throw new ForbiddenException('Forbidden');
      }
    }
    return true;
  }
} 