import express from 'express';
import itemRoutes from './lib/routes/itemRoutes';
import { errorHandler } from './lib/middlewares/errorHandler';
import thresholdRoutes from './lib/routes/thresholdRoutes';
import authRoutes from './lib/routes/authRoutes';
const app = express();

app.use(express.json());

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/thresholds', thresholdRoutes);
app.use('/api/auth', authRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
