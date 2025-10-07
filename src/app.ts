import express from 'express';
import itemRoutes from './lib/routes/itemRoutes';
import { errorHandler } from './lib/middlewares/errorHandler';

const app = express();

app.use(express.json());

// Routes
app.use('/api/items', itemRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
