// src/services/thresholdService.ts
import prisma from '../config/db';
import { subDays, subHours, subMonths, differenceInHours } from 'date-fns';
import { GetMeasurementsQuery } from '../validators/measurementValidator';
import { Parser } from 'json2csv';

export async function getMeasurementDataDashboard(area: string = 'all') {
  const whereClause = area == 'all' ? {} : { area };
  const limitClause = area == 'all' ? 150 : 50;

  return prisma.measurement.findMany({
    where: whereClause,
    orderBy: { id: 'desc' },
    take: limitClause,
  });
}

// Daftar kolom metrik dasar
const METRIC_COLUMNS = [
  'ampere_rs',
  'ampere_st',
  'ampere_tr',
  'volt_rs',
  'volt_st',
  'volt_tr',
  'pf',
  'kwh',
  'oil_pressure',
  'oil_temperature',
];

// v3 -> bisa tanpa agregasi
export async function getAggregatedData(query: GetMeasurementsQuery) {
  let {
    aggregationType,
    period,
    startDate,
    endDate,
    page = 1,
    limit = 200,
    areas,
  } = query;

  // 1. KOREKSI & DEFAULTING: Pastikan areas adalah array, defaultnya ['main']
  areas = areas && areas.length > 0 ? areas : ['main'];

  // Convert pagination to number and calculate offset
  page = Number(page);
  limit = Number(limit);
  const offset = (page - 1) * limit;

  // =============== CASE 1 – No dates & no period → RAW full with pagination ===============
  if (!period && !startDate && !endDate) { 
    const where = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Filter Area (Selalu ada karena sudah di-default)
    where.push(`area = ANY($${paramIndex++})`);
    params.push(areas);

    const sqlQuery = `
      SELECT *
      FROM measurements
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY "timestamp" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Query Total (Menggunakan parameter yang sama)
    const totalQuery = `
      SELECT COUNT(*) AS total
      FROM measurements
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(sqlQuery, ...params);
    const countRes = await prisma.$queryRawUnsafe<any[]>(totalQuery, ...params);
    const total = Number(countRes[0].total);

    const formatted = results.reduce<Record<string, Record<string, unknown>[]>>(
      (acc, row) => {
        const { area, ...metrics } = row;

        if (!acc[area]) acc[area] = [];

        // Round semua number → 2 decimal
        const roundedMetrics = Object.fromEntries(
          Object.entries(metrics).map(([key, value]) => [
            key,
            typeof value === 'number' ? Math.round(value * 100) / 100 : value,
          ]),
        );

        acc[area].push({ ...roundedMetrics, area });

        return acc;
      },
      {},
    );

    return {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      data: formatted,
    };
  }

  // =============== CASE 2 – Determine dates from period if included ===============
  if (period) {
    const now = new Date();
    endDate = now.toISOString();
    if (period === 'hour') startDate = subHours(now, 1).toISOString();
    if (period === 'day') startDate = subDays(now, 1).toISOString();
    if (period === 'week') startDate = subDays(now, 7).toISOString();
    if (period === 'month') startDate = subMonths(now, 1).toISOString();
  }

  const start = new Date(startDate!);
  const end = new Date(endDate!);
  const durationInHours = differenceInHours(end, start);

  // =============== CASE 3 – Select source table & granularity ===============
  let tableName = 'measurements';
  let granularity = '10 seconds';
  let useRawTable = false;

  if (!aggregationType) {
    useRawTable = true; // No aggregation → always raw
  } else if (durationInHours < 2) {
    useRawTable = true;
  } else if (durationInHours <= 48) {
    tableName = 'measurement_minutely';
    granularity = '1 minute';
  } else if (durationInHours <= 720) {
    tableName = 'measurement_hourly';
    granularity = '1 hour';
  } else {
    tableName = 'measurement_daily';
    granularity = '1 day';
  }

  // === Parameter Handling untuk Case 2 & 3 ===
  let paramIndex = 1;
  const whereClauses = [];
  const queryParams: any[] = [];

  // 1. Filter Tanggal (Selalu $1 dan $2)
  whereClauses.push(
    `${useRawTable ? '"timestamp"' : '"bucket"'} BETWEEN $${paramIndex++} AND $${paramIndex++}`,
  );
  queryParams.push(start, end);

  // 2. Filter Area (Selalu $3)
  whereClauses.push(`area = ANY($${paramIndex++})`);
  queryParams.push(areas);

  // ===========================================

  let selectClauses: string;
  let timeBucketColumn: string;
  const timeBucketFormula = `time_bucket('${granularity}', "timestamp")`;

  if (useRawTable) {
    if (!aggregationType) {
      // RAW without aggregation
      selectClauses = METRIC_COLUMNS.map((col) => `"${col}"`).join(', ');
      timeBucketColumn = `"timestamp"`;
    } else {
      // RAW WITH aggregation
      const aggregationFunc = aggregationType.toUpperCase();
      selectClauses = METRIC_COLUMNS.map(
        (col) => `${aggregationFunc}(${col}) AS "${col}"`,
      ).join(', ');
      timeBucketColumn = timeBucketFormula;
    }
  } else {
    // PRE-AGG TABLE
    selectClauses = METRIC_COLUMNS.map(
      (col) => `"${col}_${aggregationType}" AS "${col}"`,
    ).join(', ');
    timeBucketColumn = `"bucket"`;
  }

  const groupByClause =
    useRawTable && aggregationType
      ? `GROUP BY ${timeBucketFormula}, "area"`
      : '';

  const sqlQuery = `
    SELECT 
      ${timeBucketColumn} AS "timestamp",
      "area",
      ${selectClauses}
    FROM ${tableName}
    WHERE ${whereClauses.join(' AND ')}
    ${groupByClause}
    ORDER BY "timestamp" DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM ${tableName}
    WHERE ${whereClauses.join(' AND ')}
    ${groupByClause && !useRawTable ? `GROUP BY "area"` : ''} 
  `;

  const results = await prisma.$queryRawUnsafe<any[]>(sqlQuery, ...queryParams);
  const countRes = await prisma.$queryRawUnsafe<any[]>(
    countQuery,
    ...queryParams,
  );

  const total = Number(countRes[0].total);

  const formatted = results.reduce<Record<string, Record<string, unknown>[]>>(
    (acc, row) => {
      const { area, ...metrics } = row;

      if (!acc[area]) acc[area] = [];

      // round semua number → 2 decimal
      const rounded = Object.fromEntries(
        Object.entries(metrics).map(([key, value]) => [
          key,
          typeof value === 'number' ? Math.round(value * 100) / 100 : value,
        ]),
      );

      acc[area].push(rounded);

      return acc;
    },
    {},
  );

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: formatted,
  };
}

function flattenForCsv(rows: any[]) {
  return rows.map((r) => ({
    timestamp: r.timestamp,
    area: r.area,
    ...Object.fromEntries(METRIC_COLUMNS.map((col) => [col, r[col] ?? null])),
  }));
}

export async function exportAggregatedCsv(query: GetMeasurementsQuery) {
  let { aggregationType, period, startDate, endDate, areas } = query;

  // Default area
  areas = areas && areas.length > 0 ? areas : ['main'];

  // ===== CASE 1 — RAW tanpa date & tanpa aggregation =====
  if (!period && !startDate && !endDate) {
    const params: any[] = [];
    let paramIndex = 1;

    const where = [`area = ANY($${paramIndex++})`];
    params.push(areas);

    const sqlQuery = `
      SELECT *
      FROM measurements
      WHERE ${where.join(' AND ')}
      ORDER BY "timestamp" DESC
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(sqlQuery, ...params);
    // Round semua angka → 2 decimal
    const processed = results.map((row) => {
      const rounded = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          typeof value === 'number' ? Math.round(value * 100) / 100 : value,
        ]),
      );
      return rounded;
    });

    const rows = flattenForCsv(processed);
    const parser = new Parser();

    return parser.parse(rows);

    // return flattenForCsv(results);
  }

  // ===== CASE 2 — Tentukan startDate & endDate dari period =====
  if (period) {
    const now = new Date();
    endDate = now.toISOString();
    if (period === 'hour') startDate = subHours(now, 1).toISOString();
    if (period === 'day') startDate = subDays(now, 1).toISOString();
    if (period === 'week') startDate = subDays(now, 7).toISOString();
    if (period === 'month') startDate = subMonths(now, 1).toISOString();
  }

  const start = new Date(startDate!);
  const end = new Date(endDate!);
  const durationInHours = differenceInHours(end, start);

  // ===== CASE 3 — Pilih source table & granularity =====
  let tableName = 'measurements';
  let granularity = '10 seconds';
  let useRawTable = false;

  if (!aggregationType) {
    useRawTable = true;
  } else if (durationInHours < 2) {
    useRawTable = true;
  } else if (durationInHours <= 48) {
    tableName = 'measurement_minutely';
    granularity = '1 minute';
  } else if (durationInHours <= 720) {
    tableName = 'measurement_hourly';
    granularity = '1 hour';
  } else {
    tableName = 'measurement_daily';
    granularity = '1 day';
  }

  let paramIndex = 1;
  const whereClauses = [];
  const queryParams: any[] = [];

  whereClauses.push(
    `${useRawTable ? '"timestamp"' : '"bucket"'} BETWEEN $${paramIndex++} AND $${paramIndex++}`,
  );
  queryParams.push(start, end);

  whereClauses.push(`area = ANY($${paramIndex++})`);
  queryParams.push(areas);

  const timeBucketFormula = `time_bucket('${granularity}', "timestamp")`;
  let selectClauses: string;
  let timeBucketColumn: string;

  if (useRawTable) {
    if (!aggregationType) {
      selectClauses = METRIC_COLUMNS.map((col) => `"${col}"`).join(', ');
      timeBucketColumn = `"timestamp"`;
    } else {
      const aggFunc = aggregationType.toUpperCase();
      selectClauses = METRIC_COLUMNS.map(
        (col) => `${aggFunc}(${col}) AS "${col}"`,
      ).join(', ');
      timeBucketColumn = timeBucketFormula;
    }
  } else {
    selectClauses = METRIC_COLUMNS.map(
      (col) => `"${col}_${aggregationType}" AS "${col}"`,
    ).join(', ');
    timeBucketColumn = `"bucket"`;
  }

  const groupByClause =
    useRawTable && aggregationType
      ? `GROUP BY ${timeBucketFormula}, "area"`
      : '';

  const sqlQuery = `
    SELECT
      ${timeBucketColumn} AS "timestamp",
      "area",
      ${selectClauses}
    FROM ${tableName}
    WHERE ${whereClauses.join(' AND ')}
    ${groupByClause}
    ORDER BY "timestamp" DESC
  `;

  const results = await prisma.$queryRawUnsafe<any[]>(sqlQuery, ...queryParams);

  // Round jika AVG
  const processed = results.map((row) => {
    if (aggregationType === 'avg') {
      for (const k in row) {
        if (typeof row[k] === 'number') row[k] = Math.round(row[k] * 100) / 100;
      }
    }
    return row;
  });

  const row = flattenForCsv(processed);
  const parser = new Parser();

  return parser.parse(row);
}
