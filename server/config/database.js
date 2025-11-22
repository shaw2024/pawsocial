import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRESQL_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
