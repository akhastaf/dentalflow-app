import { Tenant } from "../../tenant/entities/tenant.entity";
import { User } from "../../user/entities/user.entity";
import { Connection } from "typeorm";
import { Seeder, Factory } from "typeorm-seeding";

export default class CreateTenantsAndUsers implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    // Clear existing data by finding all and removing
    const existingUsers = await connection.getRepository(User).find();
    const existingTenants = await connection.getRepository(Tenant).find();
    
    if (existingTenants.length > 0) {
      await connection.getRepository(Tenant).remove(existingTenants);
      console.log(`Removed ${existingTenants.length} existing tenants`);
    }
    
    if (existingUsers.length > 0) {
      await connection.getRepository(User).remove(existingUsers);
      console.log(`Removed ${existingUsers.length} existing users`);
    }

    // Create 5 users first
    const users = await factory(User)().createMany(5);
    console.log(`Created ${users.length} users`);

    // Create 2 tenants per user (10 total tenants)
    for (const user of users) {
      const tenants = await factory(Tenant)({ user }).createMany(2);
      console.log(`Created ${tenants.length} tenants for user ${user.email}`);
    }
  }
}