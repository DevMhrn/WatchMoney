import pg from 'pg';
import { configDotenv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

configDotenv();
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('Please check your .env file and ensure DATABASE_URL is configured');
    throw new Error('DATABASE_URL is required');
}

console.log('✅ DATABASE_URL found in environment variables');

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Add connection event listeners
pool.on('connect', () => {
    console.log('✅ Budget Service - Database connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ Budget Service - Database connection error:', err.message);
});

// Test the connection
export const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('🚀 Budget Service - Database connection established at:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Budget Service - Database connection failed:', error.message);
        console.error('Error details:', error.code, error.detail);
        return false;
    }
};

// Initialize database tables and functions
export const initializeDatabase = async () => {
    try {
        console.log('🔧 Initializing Budget Service database...');
        
        // First, check if required tables exist
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('tblbudget', 'tblbudgetalert', 'tblbudgetspending', 'tbluser', 'tblcategory', 'tbltransaction');
        `;
        
        const tablesResult = await pool.query(tablesQuery);
        const existingTables = tablesResult.rows.map(row => row.table_name);
        
        const requiredTables = ['tblbudget', 'tblbudgetalert', 'tblbudgetspending', 'tbluser', 'tblcategory', 'tbltransaction'];
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
            console.log(`ℹ️  Missing required tables: ${missingTables.join(', ')}`);
            console.log('💡 Please run the main server first to create the base schema.');
            console.log('⚠️  Budget Service will start but some features may not work until the schema is complete.');
            return true; // Allow service to start anyway
        }

        // Check if budget categories exist
        const budgetCategoriesQuery = `
            SELECT COUNT(*) as count FROM tblcategory WHERE type = 'budget'
        `;
        const budgetCategoriesResult = await pool.query(budgetCategoriesQuery);
        const budgetCategoriesCount = parseInt(budgetCategoriesResult.rows[0].count);

        if (budgetCategoriesCount === 0) {
            console.log('🔧 Adding budget categories...');
            const insertBudgetCategories = `
                INSERT INTO tblcategory (name, description, color_code, icon_name, type, is_system) VALUES
                ('General Budget', 'General purpose budget category', '#9C27B0', 'budget', 'budget', true),
                ('Emergency Fund', 'Emergency fund budget', '#F44336', 'emergency', 'budget', true),
                ('Vacation Fund', 'Vacation savings budget', '#FF9800', 'vacation', 'budget', true),
                ('Home Improvement', 'Home improvement projects', '#795548', 'home', 'budget', true),
                ('Car Fund', 'Car purchase or maintenance fund', '#607D8B', 'car', 'budget', true)
                ON CONFLICT (user_id, name, type) DO NOTHING;
            `;
            await pool.query(insertBudgetCategories);
            console.log('✅ Budget categories added successfully');
        }

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '..', 'migrations', 'budget_service_setup.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.log('ℹ️  No migration file found. Skipping database initialization.');
            return true;
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await pool.query(migrationSQL);
        
        console.log('✅ Budget Service database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Budget Service database:', error.message);
        
        // Check if it's just a "already exists" error, which is fine
        if (error.message.includes('already exists') || 
            error.code === '42P07' || 
            error.code === '42P06' ||
            error.message.includes('does not exist')) {
            console.log('ℹ️  Database initialization completed with warnings. Service will continue...');
            return true;
        }
        
        console.error('⚠️  Database initialization failed, but service will continue...');
        return true; // Allow service to start anyway for now
    }
};

export default pool;
