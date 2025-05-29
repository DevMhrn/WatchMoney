import pg from 'pg';
import { configDotenv } from 'dotenv';

configDotenv();
const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});



    
