import cors from 'cors';
import express from 'express';
import { configDotenv } from 'dotenv';
configDotenv();
import Routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors('*')); // Enable All CORS Requests from Anywhere
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api-v1', Routes);


app.get('/', (req, res) => {
    res.send('Hello World');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        service: 'ddevFinance API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
    console.log(`Example app listening on port ${PORT}`);
});