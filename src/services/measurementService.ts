// src/services/thresholdService.ts
import prisma from '../config/db';
import {
  subDays,
  subHours,
  subMonths,
  differenceInDays,
  differenceInHours,
} from 'date-fns';
import { GetMeasurementsQuery } from '../validators/measurementValidator';

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

export async function getAggregatedData(query: GetMeasurementsQuery) {
  // const { aggregationType, period, areas } = query;
  // let { startDate, endDate } = query;

  // if (period) {
  //   const now = new Date();

  //   endDate = now.toISOString();
  //   if (period === 'hour') startDate = subHours(now, 1).toISOString();
  //   if (period === 'day') startDate = subDays(now, 1).toISOString();
  //   if (period === 'week') startDate = subDays(now, 7).toISOString();
  //   if (period === 'month') startDate = subMonths(now, 1).toISOString();
  // }

  // const start = new Date(startDate!);
  // const end = new Date(endDate!);

  // const durationInDays = differenceInDays(end, start);

  // let tableName = 'measurement_minutely';
  // let granularity = 'minutely';

  // if (durationInDays > 30) {
  //   tableName = 'measurement_daily';
  //   granularity = 'daily';
  // } else if (durationInDays > 2) {
  //   tableName = 'measurement_hourly';
  //   granularity = 'hourly';
  // }

  // const selectClauses = METRIC_COLUMNS.map(
  //   (col) => `"${col}_${aggregationType}" AS "${col}"`,
  // ).join(', ');
  // console.log('🚀 ~ getAggregatedData ~ selectClauses:', selectClauses);

  // const whereClauses = [`bucket BETWEEN $1 AND $2`];
  // const queryParams: any[] = [start, end];

  // if (areas && areas.length > 0) {
  //   whereClauses.push(`area = ANY($3)`);
  //   queryParams.push(areas);
  // }

  // const sqlQuery = `
  //     SELECT
  //       "bucket" AS "timestamp",
  //       "area",
  //       ${selectClauses}
  //     FROM ${tableName}
  //     WHERE ${whereClauses.join(' AND ')}
  //     ORDER BY "timestamp" ASC;
  //   `;

  // const results: any[] = await prisma.$queryRawUnsafe(sqlQuery, ...queryParams);

  // const formattedData = results.reduce(
  //   (acc, row) => {
  //     const { area, ...metrics } = row;
  //     if (!acc[area]) {
  //       acc[area] = [];
  //     }
  //     // Konversi tipe data jika perlu (cth: dari string/decimal ke number)
  //     for (const key in metrics) {
  //       if (metrics[key] !== null) {
  //         metrics[key] = Number(metrics[key]);
  //       }
  //     }
  //     acc[area].push(metrics);
  //     return acc;
  //   },
  //   {} as Record<string, any[]>,
  // );

  // return {
  //   query: { ...query, startDate, endDate, granularity },
  //   data: formattedData,
  // };

  const { aggregationType, period, areas } = query;
  let { startDate, endDate } = query;

  // 1. Tentukan Rentang Waktu (Sama seperti sebelumnya)
  if (period) {
    const now = new Date();
    endDate = now.toISOString();
    if (period === 'hour') startDate = subHours(now, 1).toISOString();
    if (period === 'day') startDate = subDays(now, 1).toISOString();
    if (period === 'week') startDate = subDays(now, 7).toISOString();
    if (period === 'month') startDate = subMonths(now, 1).toISOString();
  }

  // 2. Pilih Tabel dan Granularity Secara Cerdas
  const start = new Date(startDate!);
  const end = new Date(endDate!);
  const durationInHours = differenceInHours(end, start);

  let tableName: string;
  let granularity: string;
  let useRawTable = false;

  // JIKA durasi kurang dari 2 jam, AMBIL DARI TABEL RAW untuk data real-time
  if (durationInHours < 2) {
    tableName = 'measurements'; // Nama tabel asli
    granularity = '10 seconds'; // Kita bisa agregasi per 10 detik
    useRawTable = true;
  } else if (durationInHours <= 48) {
    // Antara 2 jam - 2 hari
    tableName = 'measurement_minutely';
    granularity = '1 minute';
  } else if (durationInHours <= 720) {
    // Antara 2 hari - 30 hari
    tableName = 'measurement_hourly';
    granularity = '1 hour';
  } else {
    // Lebih dari 30 hari
    tableName = 'measurement_daily';
    granularity = '1 day';
  }

  // 3. Bangun Query Secara Dinamis Berdasarkan Jenis Tabel
  let selectClauses: string;
  let timeBucketColumn: string;

  if (useRawTable) {
    // LOGIKA UNTUK TABEL RAW `measurements`
    // Kita harus melakukan agregasi (AVG, MAX, MIN) dan time_bucket secara manual
    const aggregationFunc = aggregationType.toUpperCase(); // AVG, MAX, atau MIN
    selectClauses = METRIC_COLUMNS.map(
      (col) => `${aggregationFunc}(${col}) AS "${col}"`,
    ).join(', ');
    timeBucketColumn = `time_bucket('${granularity}', "timestamp")`;
  } else {
    // LOGIKA UNTUK TABEL AGREGASI (Sama seperti sebelumnya)
    selectClauses = METRIC_COLUMNS.map(
      (col) => `"${col}_${aggregationType}" AS "${col}"`,
    ).join(', ');
    timeBucketColumn = `"bucket"`;
  }

  const whereClauses = [
    `${useRawTable ? '"timestamp"' : '"bucket"'} BETWEEN $1 AND $2`,
  ];
  const queryParams: any[] = [start, end];

  if (areas && areas.length > 0) {
    whereClauses.push(`area = ANY($3)`);
    queryParams.push(areas);
  }

  const groupByClause = useRawTable ? `GROUP BY "timestamp", "area"` : '';

  const sqlQuery = `
      SELECT 
        ${timeBucketColumn} AS "timestamp",
        "area",
        ${selectClauses}
      FROM ${tableName}
      WHERE ${whereClauses.join(' AND ')}
        ${groupByClause}
      ORDER BY "timestamp" ASC;
`;

  // 4. Eksekusi dan Format Hasil (Sama seperti sebelumnya)
  const results: any[] = await prisma.$queryRawUnsafe(sqlQuery, ...queryParams);

  const formattedData = results.reduce(
    (acc, row) => {
      const { area, ...metrics } = row;
      if (!acc[area]) acc[area] = [];
      for (const key in metrics) {
        if (metrics[key] !== null && !(metrics[key] instanceof Date)) {
          metrics[key] = Number(metrics[key]);
        }
      }
      acc[area].push(metrics);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  return {
    query: {
      ...query,
      startDate,
      endDate,
      granularity: useRawTable ? 'realtime' : granularity,
      sourceTable: tableName,
    },
    data: formattedData,
  };
}
