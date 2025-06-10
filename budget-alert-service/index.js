import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { configDotenv } from 'dotenv';

// Import configurations and routes
import { testConnection, initializeDatabase } from './config/database.js';
import emailConfig from './config/email.js';
import routes from './routes/index.js';
import { authMiddleware } from './middleware/authMiddleware.js';

// Load environment variables
configDotenv();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Basic middleware
app.use(compression());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Apply authentication middleware to specific routes only, not categories
app.use('/api/budgets', authMiddleware);
app.use('/api/alerts', authMiddleware);
app.use('/api/transactions', authMiddleware);

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Budget Alert Service API',
        version: '1.0.0',
        documentation: '/api/info',
        health: '/api/health',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        statusCode: 404,
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    
    res.status(error.statusCode || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

// Start server
const server = app.listen(PORT, async () => {
    console.log('\n🚀 Budget Alert Service Starting...\n');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }
    
    // Initialize database (run migrations)
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
        console.warn('⚠️  Database initialization had issues, but service will continue...');
    }
    
    // Email service temporarily disabled
    console.log('📧 Email service disabled - alerts will be stored in database only');
    const emailVerified = false;
    
    /* Original email verification (commented out):
    // Test email configuration
    const emailVerified = await emailConfig.verifyConnection();
    if (!emailVerified) {
        console.warn('⚠️  Email configuration not verified. Email alerts may not work.');
    }
    */
    
    console.log(`\n✅ Budget Alert Service running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/info`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔄 Transaction Endpoint: http://localhost:${PORT}/api/transactions`);
    console.log(`\n📋 Key Endpoints:`);
    console.log(`   POST /api/transactions - Process transaction & check budgets`);
    console.log(`   POST /api/budgets - Create budget`);
    console.log(`   GET  /api/budgets/:userId - Get user budgets`);
    console.log(`   GET  /api/alerts/:userId - Get user alerts`);
    console.log(`\n🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📧 Email Alerts: Disabled (database alerts only)`);
    console.log('\n' + '='.repeat(60) + '\n');
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default app;
