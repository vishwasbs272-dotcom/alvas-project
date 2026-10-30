import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { apiRouter } from './routes/api.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Security & Parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Support up to 5MB payloads for Base64 hazard images
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Root fallback / ping
app.get('/', (_req, res) => {
  res.json({
    app: 'STRATUM.AI Core API',
    status: 'ONLINE',
    documentation: 'See /api/health and /api/reports',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ==============================================================
   STRATUM.AI - Explainable Civic Triage & Spatial Intelligence
  ==============================================================
   Server Running : http://localhost:${PORT}
   API Base       : http://localhost:${PORT}/api
   Health Check   : http://localhost:${PORT}/api/health
  ==============================================================
  `);
});
