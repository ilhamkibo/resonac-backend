import express from 'express';
import itemRoutes from './routes/itemRoutes';
import { errorHandler } from './lib/middlewares/errorHandler';
import thresholdRoutes from './routes/thresholdRoutes';
import authRoutes from './routes/authRoutes';
import measurementRoutes from './routes/measurementRoute';
const app = express();

app.use(express.json());

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/thresholds', thresholdRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
