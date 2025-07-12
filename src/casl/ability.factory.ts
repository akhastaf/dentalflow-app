import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { User } from '../user/entities/user.entity';
import { Staff } from '../staff/entities/staff.entity';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subjects = 'patient' | 'appointment' | 'staff' | 'tenant' | 'all';
export type AppAbility = Ability<[Actions, Subjects]>;

export function defineAbilityFor(user: User, staff?: Staff): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(Ability as AbilityClass<AppAbility>);

  if (user.isPlatformAdmin) {
    can('manage', 'all');
    return build({ detectSubjectType: (item: any) => item.constructor as ExtractSubjectType<Subjects> });
  }

  if (staff?.isOwner) {
    can('manage', 'all');
    return build({ detectSubjectType: (item: any) => item.constructor as ExtractSubjectType<Subjects> });
  }

  if (staff?.permissions) {
    for (const perm of staff.permissions) {
      // e.g. 'patient_read' => can('read', 'patient')
      const [subject, action] = perm.split('_').reverse();
      can(action as Actions, subject as Subjects);
    }
  }

  return build({ detectSubjectType: (item: any) => item.constructor as ExtractSubjectType<Subjects> });
} 