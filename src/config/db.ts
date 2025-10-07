import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not set in env');
}

const pool = new Pool({ connectionString });

async function verifyConnection(): Promise<void> {
  try {
    // Attempt to acquire a client from the pool
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release(); // Release the client back to the pool
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
  }
}

// Immediately verify connection upon module load.
verifyConnection();

export default pool;

// export async function query(text: string, params?: any[]) {
//   const res = await pool.query(text, params);
//   return res;
// }

