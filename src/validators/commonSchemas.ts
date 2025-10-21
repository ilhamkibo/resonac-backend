import { z } from 'zod';

// Definisikan dan ekspor skema untuk 'area'
export const areaSchema = z.enum(['main', 'pilot', 'oil']);
export const periodSchema = z.enum(['daily', 'weekly', 'monthly']);
