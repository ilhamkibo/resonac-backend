// src/services/thresholdService.ts
import prisma from '../config/db';

export async function getMeasurementDataDashboard(area: string = 'all') {
  const whereClause = area == 'all' ? {} : { area };
  const limitClause = area == 'all' ? 150 : 50;

  return prisma.measurement.findMany({
    where: whereClause,
    orderBy: { id: 'desc' },
    take: limitClause,
  });
}
