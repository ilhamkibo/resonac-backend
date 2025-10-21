import { z } from 'zod';

// Definisikan dan ekspor skema untuk 'area'
export const areaSchema = z.enum(['main', 'pilot', 'oil']);
export const periodSchema = z.enum(['hour', 'daily', 'weekly', 'monthly']);
export const aggregateSchema = z.enum(['avg', 'min', 'max']);
export const resolutionSchema = z.enum(['second', 'minute', 'hour', 'day']);
