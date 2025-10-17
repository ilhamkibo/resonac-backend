// src/services/thresholdService.ts
import prisma from '../config/db';
import { thresholdSchema } from '../lib/validators/thresholdValidator';

export async function getMeasurementDataDashboard(area: string = 'all') {
  const whereClause = area == 'all' ? {} : { area };
  const limitClause = area == 'all' ? 150 : 50;

  return prisma.measurement.findMany({
    where: whereClause,
    orderBy: { id: 'desc' },
    take: limitClause,
  });
}

export async function getThresholdById(id: number) {
  const data = await prisma.threshold.findUnique({ where: { id } });
  if (!data) {
    const error: any = new Error('Threshold not found');
    error.statusCode = 404;
    throw error;
  }
  return data;
}

export async function createThreshold(data: any) {
  const parsed = thresholdSchema.parse(data);
  return prisma.threshold.create({ data: parsed });
}

export async function updateThreshold(id: number, data: any) {
  const parsed = thresholdSchema.parse(data);
  return prisma.threshold.update({ where: { id }, data: parsed });
}

export async function deleteThreshold(id: number) {
  return prisma.threshold.delete({ where: { id } });
}
