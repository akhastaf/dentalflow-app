import { define } from 'typeorm-seeding';
import { faker } from '@faker-js/faker';
import { Tenant, SubscriptionPlan, Language } from '../../tenant/entities/tenant.entity';
import { User } from '../../user/entities/user.entity';

define(Tenant, (fakerInstance: typeof faker, context?: { user: User })  => {
  const tenant = new Tenant();
  tenant.name = `Dental Clinic ${Math.floor(Math.random() * 9000) + 1000}`;
  tenant.slug = fakerInstance.helpers.slugify(tenant.name).toLowerCase();
  tenant.phone = `+2126${Math.floor(Math.random() * 90000000) + 10000000}`;
  tenant.email = fakerInstance.internet.email();
  tenant.address = `${Math.floor(Math.random() * 999) + 1} Main Street`;
  tenant.city = 'Casablanca';
  const plans = Object.values(SubscriptionPlan);
  tenant.subscriptionPlan = plans[Math.floor(Math.random() * plans.length)];
  tenant.isActive = true;
  const languages = Object.values(Language);
  tenant.language = languages[Math.floor(Math.random() * languages.length)];
  tenant.timezone = 'Africa/Casablanca';
  
  tenant.owner = context?.user;

  return tenant;
});
