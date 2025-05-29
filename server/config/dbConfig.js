import pg from 'pg';
import { configDotenv } from 'dotenv';

configDotenv();
const { Pool } = pg;

// Check if DATABASE_URL is present
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
} else {
    console.log('✅ DATABASE_URL environment variable found');
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Add connection event listeners
pool.on('connect', () => {
    console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err.message);
});

// Test the connection
pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('🚀 Database connection established at:', result.rows[0].now);
    }
});


