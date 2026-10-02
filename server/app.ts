import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { router } from './routes.ts';

export const app = express();

const allowedOrigins = [
  'https://pharma-care-smart.vercel.app',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'ionic://localhost',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : [])
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, APK WebViews, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.run.app') ||
      origin.includes('localhost:') ||
      origin.includes('127.0.0.1:')
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'X-User-Phone',
    'X-User-Name',
    'X-Device-Id'
  ],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

const corsMiddleware = cors(corsOptions);
app.use(corsMiddleware);
app.options('*', corsMiddleware);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Mount API routes at both /api and root (to handle all Vercel/direct path variants)
app.use('/api', router);
app.use('/', router);

// Explicit JSON 404 for any unmatched /api/* route to strictly prevent HTML fallbacks
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `API endpoint ${req.method} ${req.path} not found on this server.`,
  });
});

export default app;
