import { define } from 'typeorm-seeding';
import { faker } from '@faker-js/faker';
import { User } from '../../user/entities/user.entity';
import * as bcryptjs from 'bcryptjs'

define(User, () => {
  const user = new User({
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    email: faker.internet.email(),
    password: 'password123', // Use a consistent password for testing
    is_active: true,
    is_verified: true,
  });
  return user;
});
