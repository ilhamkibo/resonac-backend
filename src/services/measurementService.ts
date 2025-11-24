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

// v1 -> salah untuk day period
// export async function getAggregatedData(query: GetMeasurementsQuery) {
//   const { aggregationType, period, areas } = query;
//   let { startDate, endDate } = query;

//   // 1. Tentukan Rentang Waktu (Sama seperti sebelumnya)
//   if (period) {
//     const now = new Date();
//     endDate = now.toISOString();
//     if (period === 'hour') startDate = subHours(now, 1).toISOString();
//     if (period === 'day') startDate = subDays(now, 1).toISOString();
//     if (period === 'week') startDate = subDays(now, 7).toISOString();
//     if (period === 'month') startDate = subMonths(now, 1).toISOString();
//   }

//   // 2. Pilih Tabel dan Granularity Secara Cerdas
//   const start = new Date(startDate!);
//   const end = new Date(endDate!);
//   const durationInHours = differenceInHours(end, start);

//   let tableName: string;
//   let granularity: string;
//   let useRawTable = false;

//   // JIKA durasi kurang dari 2 jam, AMBIL DARI TABEL RAW untuk data real-time
//   if (durationInHours < 2) {
//     tableName = 'measurements'; // Nama tabel asli
//     granularity = '10 seconds'; // Kita bisa agregasi per 10 detik
//     useRawTable = true;
//   } else if (durationInHours <= 48) {
//     // Antara 2 jam - 2 hari
//     tableName = 'measurement_minutely';
//     granularity = '1 minute';
//   } else if (durationInHours <= 720) {
//     // Antara 2 hari - 30 hari
//     tableName = 'measurement_hourly';
//     granularity = '1 hour';
//   } else {
//     // Lebih dari 30 hari
//     tableName = 'measurement_daily';
//     granularity = '1 day';
//   }

//   // 3. Bangun Query Secara Dinamis Berdasarkan Jenis Tabel
//   let selectClauses: string;
//   let timeBucketColumn: string;

//   if (useRawTable) {
//     // LOGIKA UNTUK TABEL RAW `measurements`
//     // Kita harus melakukan agregasi (AVG, MAX, MIN) dan time_bucket secara manual
//     const aggregationFunc = aggregationType.toUpperCase(); // AVG, MAX, atau MIN
//     selectClauses = METRIC_COLUMNS.map(
//       (col) => `${aggregationFunc}(${col}) AS "${col}"`,
//     ).join(', ');
//     timeBucketColumn = `time_bucket('${granularity}', "timestamp")`;
//   } else {
//     // LOGIKA UNTUK TABEL AGREGASI (Sama seperti sebelumnya)
//     selectClauses = METRIC_COLUMNS.map(
//       (col) => `"${col}_${aggregationType}" AS "${col}"`,
//     ).join(', ');
//     timeBucketColumn = `"bucket"`;
//   }

//   const whereClauses = [
//     `${useRawTable ? '"timestamp"' : '"bucket"'} BETWEEN $1 AND $2`,
//   ];
//   const queryParams: any[] = [start, end];

//   if (areas && areas.length > 0) {
//     whereClauses.push(`area = ANY($3)`);
//     queryParams.push(areas);
//   }

//   const groupByClause = useRawTable ? `GROUP BY "timestamp", "area"` : '';

//   const sqlQuery = `
//       SELECT
//         ${timeBucketColumn} AS "timestamp",
//         "area",
//         ${selectClauses}
//       FROM ${tableName}
//       WHERE ${whereClauses.join(' AND ')}
//         ${groupByClause}
//       ORDER BY "timestamp" ASC;
// `;

//   // 4. Eksekusi dan Format Hasil (Sama seperti sebelumnya)
//   const results: any[] = await prisma.$queryRawUnsafe(sqlQuery, ...queryParams);

//   const formattedData = results.reduce(
//     (acc, row) => {
//       const { area, ...metrics } = row;
//       if (!acc[area]) acc[area] = [];
//       for (const key in metrics) {
//         if (metrics[key] !== null && !(metrics[key] instanceof Date)) {
//           metrics[key] = Number(metrics[key]);
//         }
//       }
//       acc[area].push(metrics);
//       return acc;
//     },
//     {} as Record<string, any[]>,
//   );

//   return {
//     query: {
//       ...query,
//       startDate,
//       endDate,
//       granularity: useRawTable ? 'realtime' : granularity,
//       sourceTable: tableName,
//     },
//     data: formattedData,
//   };
// }

// v2 -> Perbaikan day period aman grouping nya
// export async function getAggregatedData(query: GetMeasurementsQuery) {
//   const { aggregationType, period, areas } = query;
//   let { startDate, endDate } = query;

//   // 1. Tentukan Rentang Waktu (Sama seperti sebelumnya)
//   if (period) {
//     const now = new Date();
//     endDate = now.toISOString();
//     if (period === 'hour') startDate = subHours(now, 1).toISOString();
//     if (period === 'day') startDate = subDays(now, 1).toISOString();
//     if (period === 'week') startDate = subDays(now, 7).toISOString();
//     if (period === 'month') startDate = subMonths(now, 1).toISOString();
//   }

//   // 2. Pilih Tabel dan Granularity Secara Cerdas
//   const start = new Date(startDate!);
//   const end = new Date(endDate!);
//   const durationInHours = differenceInHours(end, start);

//   let tableName: string;
//   let granularity: string;
//   let useRawTable = false;

//   // JIKA durasi kurang dari 2 jam, AMBIL DARI TABEL RAW untuk data real-time
//   if (durationInHours < 2) {
//     tableName = 'measurements'; // Nama tabel asli
//     granularity = '10 seconds'; // Kita bisa agregasi per 10 detik
//     useRawTable = true;
//   } else if (durationInHours <= 48) {
//     // Antara 2 jam - 2 hari
//     tableName = 'measurement_minutely';
//     granularity = '1 minute';
//   } else if (durationInHours <= 720) {
//     // Antara 2 hari - 30 hari
//     tableName = 'measurement_hourly';
//     granularity = '1 hour';
//   } else {
//     // Lebih dari 30 hari
//     tableName = 'measurement_daily';
//     granularity = '1 day';
//   }

//   // 3. Bangun Query Secara Dinamis Berdasarkan Jenis Tabel
//   let selectClauses: string;
//   let timeBucketColumn: string;
//   const timeBucketFormula = `time_bucket('${granularity}', "timestamp")`;

//   if (useRawTable) {
//     // LOGIKA UNTUK TABEL RAW `measurements`
//     // Kita harus melakukan agregasi (AVG, MAX, MIN) dan time_bucket secara manual
//     const aggregationFunc = aggregationType.toUpperCase(); // AVG, MAX, atau MIN
//     selectClauses = METRIC_COLUMNS.map(
//       (col) => `${aggregationFunc}(${col}) AS "${col}"`,
//     ).join(', ');
//     timeBucketColumn = timeBucketFormula;
//   } else {
//     // LOGIKA UNTUK TABEL AGREGASI (Sama seperti sebelumnya)
//     selectClauses = METRIC_COLUMNS.map(
//       (col) => `"${col}_${aggregationType}" AS "${col}"`,
//     ).join(', ');
//     timeBucketColumn = `"bucket"`;
//   }

//   const whereClauses = [
//     `${useRawTable ? '"timestamp"' : '"bucket"'} BETWEEN $1 AND $2`,
//   ];
//   const queryParams: any[] = [start, end];

//   if (areas && areas.length > 0) {
//     whereClauses.push(`area = ANY($3)`);
//     queryParams.push(areas);
//   }

//   const groupByClause = useRawTable
//     ? `GROUP BY ${timeBucketFormula}, "area"` // 👈 Mengulang formula time_bucket
//     : '';

//   const sqlQuery = `
//     SELECT
//       ${timeBucketColumn} AS "timestamp",
//       "area",
//       ${selectClauses}
//     FROM ${tableName}
//     WHERE ${whereClauses.join(' AND ')}bananan
//     ${groupByClause ? ` ${groupByClause} ` : ''}
//     ORDER BY "timestamp" ASC;
//   `;

//   // 4. Eksekusi dan Format Hasil (Sama seperti sebelumnya)
//   const results: any[] = await prisma.$queryRawUnsafe(sqlQuery, ...queryParams);

//   const formattedData = results.reduce(
//     (acc, row) => {
//       const { area, ...metrics } = row;
//       if (!acc[area]) acc[area] = [];
//       for (const key in metrics) {
//         if (metrics[key] !== null && !(metrics[key] instanceof Date)) {
//           metrics[key] = Number(metrics[key]);
//         }
//       }
//       acc[area].push(metrics);
//       return acc;
//     },
//     {} as Record<string, any[]>,
//   );

//   return {
//     query: {
//       ...query,
//       startDate,
//       endDate,
//       granularity: useRawTable ? 'realtime' : granularity,
//       sourceTable: tableName,
//     },
//     data: formattedData,
//   };
// }

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

    // Format per area
    const formatted = results.reduce<Record<string, any[]>>((acc, row) => {
      const { area, ...metrics } = row;
      if (!acc[area]) acc[area] = [];
      acc[area].push({ ...metrics, area });
      return acc;
    }, {});

    return {
      // query: {
      //   ...query,
      // sourceTable: 'measurements',
      // granularity: 'raw'
      // },
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
  // Tidak perlu cek areas && areas.length > 0 karena sudah di-default di awal
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
  // Untuk count, kita hanya ingin tahu jumlah total baris,
  // bukan jumlah total baris per area, jadi kita gunakan count sederhana
  const countRes = await prisma.$queryRawUnsafe<any[]>(
    countQuery,
    ...queryParams,
  );

  // Jika CountQuery menghasilkan banyak baris (karena GROUP BY), kita harus menjumlahkannya,
  // atau lebih baik, hapus GROUP BY pada count query, kecuali jika tujuannya menghitung total unik area.
  // Untuk tujuan pagination sederhana, kita asumsikan COUNT(*) tanpa GROUP BY sudah cukup.
  const total = Number(countRes[0].total);

  // Format per area
  // const formatted = results.reduce<Record<string, any[]>>((acc, row) => {
  //   const { area, ...metrics } = row;
  //   // Menghapus area dari metrics, tapi mempertahankan di objek key.
  //   if (!acc[area]) acc[area] = [];
  //   delete (metrics as any).area; // Hapus jika terduplikasi saat select *
  //   acc[area].push({ ...metrics });
  //   return acc;
  // }, {});

  // Format per area + round if AVG
  const formatted = results.reduce<Record<string, any[]>>((acc, row) => {
    const { area, ...metrics } = row;
    if (!acc[area]) acc[area] = [];

    const rounded =
      aggregationType === 'avg'
        ? Object.fromEntries(
            Object.entries(metrics).map(([k, v]) => [
              k,
              typeof v === 'number' ? Math.round(v * 100) / 100 : v,
            ]),
          )
        : metrics;

    acc[area].push(rounded);
    return acc;
  }, {});

  return {
    // query: {
    //   ...query,
    //   startDate,
    //   endDate,
    //   granularity,
    //   sourceTable: tableName,
    // },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: formatted,
  };
}
