const path = require('path') // eslint-disable-line
const envConfig = require('dotenv').config({
  path: path.resolve(__dirname, `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`),
})

function env(key) {
  return envConfig.parsed[key] || process.env[key]
}

module.exports = {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost', // Fallback if running CLI outside docker compose network
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [__dirname + '/src/**/*.entity{.ts,.js}', 'dist/**/*.entity{.js}'], // Important: Include paths for both TS (dev) and JS (compiled)
    migrations: [__dirname + '/src/database/migrations/*{.ts,.js}', 'dist/database/migrations/*{.js}'], // Path to your migration files
    migrationsTableName: 'migrations_history', // Optional
    synchronize: false, // Crucial: should be false when using migrations
    logging: true,
    seeds: ['src/database/seeds/**/*{.ts,.js}'],
    factories: ['src/database/factories/**/*{.ts,.js}'],
  }