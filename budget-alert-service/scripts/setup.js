import { configDotenv } from 'dotenv';

// Load environment variables first
configDotenv();

import { testConnection } from '../config/database.js';
import emailConfig from '../config/email.js';

console.log('🔧 Setting up Budget Alert Service...\n');

async function setupService() {
    let hasErrors = false;

    // Check environment variables
    console.log('📋 Checking environment variables...');
    const requiredEnvVars = [
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'EMAIL_USER',
        'EMAIL_PASSWORD',
        'EMAIL_FROM'
    ];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.error(`❌ Missing required environment variable: ${envVar}`);
            hasErrors = true;
        } else {
            console.log(`✅ ${envVar} is set`);
        }
    }

    if (hasErrors) {
        console.error('\n❌ Environment setup incomplete. Please check your .env file.');
        process.exit(1);
    }

    // Test database connection
    console.log('\n🗄️  Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
        console.error('❌ Database connection failed');
        hasErrors = true;
    }

    // Test email configuration
    console.log('\n📧 Testing email configuration...');
    const emailVerified = await emailConfig.verifyConnection();
    
    if (!emailVerified) {
        console.warn('⚠️  Email verification failed - alerts may not work');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (hasErrors) {
        console.error('❌ Setup completed with errors');
        console.log('Please fix the issues above before starting the service.');
        process.exit(1);
    } else {
        console.log('✅ Setup completed successfully!');
        console.log('\nYou can now start the service with:');
        console.log('  npm start     (production)');
        console.log('  npm run dev   (development)');
        console.log('\nService will be available at: http://localhost:' + (process.env.PORT || 3002));
    }
}

setupService().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
});
