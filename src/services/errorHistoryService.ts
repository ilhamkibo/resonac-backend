import prisma from '../config/db';
import { Prisma } from '../generated/prisma';
import { ErrorHistoryQuery } from '../validators/errorHistoryValidator';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

function calculateDateRange(query: ErrorHistoryQuery): {
  gte?: Date;
  lte?: Date;
} {
  const now = new Date();
  if (query.period) {
    switch (query.period) {
      case 'daily':
        return { gte: startOfDay(now), lte: endOfDay(now) };
      case 'weekly':
        return { gte: startOfWeek(now), lte: endOfWeek(now) };
      case 'monthly':
        return { gte: startOfMonth(now), lte: endOfMonth(now) };
    }
  }
  if (query.startDate && query.endDate) {
    return { gte: startOfDay(query.startDate), lte: endOfDay(query.endDate) };
  }
  return {};
}

export async function getHistoryError(query: ErrorHistoryQuery) {
  const where: Prisma.ErrorHistoryWhereInput = {};
  const dateFilter = calculateDateRange(query);

  if (dateFilter.gte || dateFilter.lte) where.timestamp = dateFilter;
  if (query.area) where.area = query.area;
  if (query.parameter) {
    where.parameter = Array.isArray(query.parameter)
      ? { in: query.parameter }
      : query.parameter;
  }

  // const skip = (query.page - 1) * query.limit;
  // const take = query.limit;

  // const [data, total] = await prisma.$transaction([
  //   prisma.errorHistory.findMany({
  //     where,
  //     // skip,
  //     // take,
  //     orderBy: { timestamp: 'desc' },
  //   }),
  //   prisma.errorHistory.count({ where }),
  // ]);

  const data = await prisma.errorHistory.findMany({
    where,
    // skip,
    // take,
    orderBy: { timestamp: 'desc' },
  });
  const total = await prisma.errorHistory.count({ where });

  // return {
  //   data,
  //   meta: {
  //     total,
  //     // page: query.page,
  //     // limit: take,
  //     // totalPages: Math.ceil(total / take),
  //   },
  // };

  return data;
}
