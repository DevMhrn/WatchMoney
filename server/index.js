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

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
    console.log(`Example app listening on port ${PORT}`);
});