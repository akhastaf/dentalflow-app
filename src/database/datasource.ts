import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost', // Fallback if running CLI outside docker compose network
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [__dirname + '/../**/*.entity{.ts,.js}', 'dist/**/*.entity{.js}'], // Important: Include paths for both TS (dev) and JS (compiled)
    migrations: [__dirname + '/migrations/*{.ts,.js}', 'dist/database/migrations/*{.js}'], // Path to your migration files
    migrationsTableName: 'migrations_history', // Optional
    synchronize: false, // Crucial: should be false when using migrations
    logging: true,
}

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;