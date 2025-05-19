import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import process from "process";

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

console.log("Connecting to PostgreSQL at:", process.env.DB_HOST);

// Also export as default for backward compatibility
export default pool;
