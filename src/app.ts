import express from 'express';
import { errorHandler } from './lib/middlewares/errorHandler';
import cors from 'cors';
import apiRoutes from './routes/index'; // ✨ Impor router induk

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

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

// Semua rute yang ada di dalam apiRoutes akan otomatis memiliki prefix '/api'
app.use('/api', apiRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
