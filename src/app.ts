import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

export const createApp = () => {
  const app = express();

  // Global Middleware
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow localhost, vercel deployments, or requests with no origin (curl/mobile/tools)
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for hackathon demonstration
      }
    },
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-role',
      'x-mock-role',
      'x-user-id',
      'x-mock-user-id',
      'x-user-empid',
      'x-user-station',
    ],
  }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Welcome / Root route
  app.get('/', (req, res) => {
    res.json({
      name: 'RailPravah API',
      description: 'AI-Powered Automatic Block Planning for Indian Railways',
      version: '1.0.0',
      documentation: {
        health: '/health',
        api_prefix: '/api/v1',
      },
    });
  });

  // Mount API at /api/v1, /api, and root for spec convenience
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
};
