// src/services/thresholdService.ts
import prisma from '../config/db';
import {
  CreateThresholdInput,
  UpdateThresholdInput,
} from '../validators/thresholdValidator';

export async function getAllThresholds(area?: 'main' | 'pilot' | 'oil') {
  const whereClause = area ? { area } : {};
  return prisma.threshold.findMany({
    where: whereClause,
    orderBy: { id: 'asc' },
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

export async function createThreshold(data: CreateThresholdInput) {
  const existingThreshold = await prisma.threshold.findFirst({
    where: { area: data.area, parameter: data.parameter },
  });

  if (existingThreshold) {
    const error: any = new Error('Threshold already exists');
    error.statusCode = 400;
    throw error;
  }
  return prisma.threshold.create({ data });
}

export async function updateThreshold(id: number, data: UpdateThresholdInput) {
  return prisma.threshold.update({ where: { id }, data });
}

export async function deleteThreshold(id: number) {
  return prisma.threshold.delete({ where: { id } });
}
