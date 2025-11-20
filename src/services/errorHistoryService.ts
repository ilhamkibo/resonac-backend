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
  subWeeks,
  subMonths,
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

  const skip = (query.page - 1) * query.limit;
  const take = query.limit;

  const [data, total] = await prisma.$transaction([
    prisma.errorHistory.findMany({
      where,
      skip,
      take,
      orderBy: { timestamp: 'desc' },
      include: { threshold: true },
    }),
    prisma.errorHistory.count({ where }),
  ]);

  // const data = await prisma.errorHistory.findMany({
  //   where,
  //   skip,
  //   take,
  //   orderBy: { timestamp: 'desc' },
  // });
  // const total = await prisma.errorHistory.count({ where });

  return {
    data,
    meta: {
      total,
      page: query.page,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };

  return data;
}

type AreaGroup = {
  area: string | null;
  _count: { area: number };
};

type AreaParameterGroup = {
  area: string | null;
  parameter: string | null;
  _count: { parameter: number };
};

export async function getErrorHistoryComparison() {
  const now = new Date();

  // Weekly
  const thisWeekStart = startOfWeek(now);
  const thisWeekEnd = endOfWeek(now);

  const lastWeekStart = startOfWeek(subWeeks(now, 1));
  const lastWeekEnd = endOfWeek(subWeeks(now, 1));

  // Monthly
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    thisWeek,
    lastWeek,
    thisMonth,
    lastMonth,
    monthlyAreaDetailsRaw,
    monthlyParameterDetailsRaw,
    monthlyAreaParameterDetailsRaw,
  ] = await prisma.$transaction([
    prisma.errorHistory.count({
      where: { timestamp: { gte: thisWeekStart, lte: thisWeekEnd } },
    }),
    prisma.errorHistory.count({
      where: { timestamp: { gte: lastWeekStart, lte: lastWeekEnd } },
    }),
    prisma.errorHistory.count({
      where: { timestamp: { gte: thisMonthStart, lte: thisMonthEnd } },
    }),
    prisma.errorHistory.count({
      where: { timestamp: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),

    // === GROUP BY AREA (total per area) ===
    prisma.errorHistory.groupBy({
      by: ['area'],
      _count: { area: true },
      where: { timestamp: { gte: thisMonthStart, lte: thisMonthEnd } },
      orderBy: { area: 'asc' },
    }),

    // === GROUP BY PARAMETER GLOBAL (opsional) ===
    prisma.errorHistory.groupBy({
      by: ['parameter'],
      _count: { parameter: true },
      where: { timestamp: { gte: thisMonthStart, lte: thisMonthEnd } },
      orderBy: { parameter: 'asc' },
    }),

    // === GROUP BY AREA + PARAMETER (breakdown parameter per area) ===
    prisma.errorHistory.groupBy({
      by: ['area', 'parameter'],
      _count: { parameter: true },
      where: { timestamp: { gte: thisMonthStart, lte: thisMonthEnd } },
      orderBy: [{ area: 'asc' }, { parameter: 'asc' }],
    }),
  ]);

  const monthlyAreaDetails = monthlyAreaDetailsRaw as AreaGroup[];
  const monthlyParameterDetails =
    monthlyParameterDetailsRaw as AreaParameterGroup[];
  const monthlyAreaParameterDetails =
    monthlyAreaParameterDetailsRaw as AreaParameterGroup[];

  // === Build nested data: area -> parameters ===
  const areaWithParameters = monthlyAreaDetails.map((areaItem) => {
    const parameters = monthlyAreaParameterDetails
      .filter((p) => p.area === areaItem.area)
      .map((p) => ({
        parameter: p.parameter,
        count: p._count.parameter,
      }));

    return {
      area: areaItem.area,
      total: areaItem._count.area,
      parameters,
    };
  });

  return {
    weekly: { thisWeek, lastWeek },
    monthly: { thisMonth, lastMonth },
    details: {
      byArea: monthlyAreaDetails.map((item) => ({
        area: item.area,
        count: item._count.area,
      })),
      byParameter: monthlyParameterDetails.map((item) => ({
        parameter: item.parameter,
        count: item._count.parameter,
      })),
      byAreaParameter: areaWithParameters, // NEW STRUCTURE
    },
  };
}
