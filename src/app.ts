import express from 'express';
import itemRoutes from './routes/itemRoutes';
import { errorHandler } from './lib/middlewares/errorHandler';
import thresholdRoutes from './routes/thresholdRoutes';
import authRoutes from './routes/authRoutes';
import measurementRoutes from './routes/measurementRoute';
import cors from 'cors';

const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://192.168.245.102:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/thresholds', thresholdRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
