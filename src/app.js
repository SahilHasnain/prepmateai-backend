import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import aiRoutes from './routes/aiRoutes.js';
import ocrRoutes from './routes/ocrRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'exp://*'],
  methods: ['GET', 'POST']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/ocr', ocrRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test Gemini connection
app.get('/api/test-gemini', async (req, res) => {
  try {
    const { generateResponse } = await import('./services/geminiService.js');
    const response = await generateResponse('Who are you?');
    console.log('Gemini AI Response:', response);
    res.json({ success: true, response });
  } catch (error) {
    console.error('Gemini test failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default app;
