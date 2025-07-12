import { SetMetadata } from '@nestjs/common';

export interface RequiredRule {
  action: string;
  subject: string;
}

export const CHECK_ABILITY = 'check_ability';
export const CheckAbility = (...rules: RequiredRule[]) => SetMetadata(CHECK_ABILITY, rules); 