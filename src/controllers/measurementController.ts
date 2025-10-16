import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../lib/response/response';
import { dynamicMeasurementSchema } from '../lib/validators/measurementValidator';
import { asyncHandler } from '../lib/utils/asyncHandler';
import * as measurementService from '../services/measurementService';

//Ambil data untuk dashboard
export const getMeasurementDataDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const { area } = req.query as { area?: string };

    const data = await measurementService.getMeasurementDataDashboard(area);
    return successResponse(
      res,
      'Measurement data dashboard list fetched successfully',
      data,
    );
  },
);

// 🔹 3️⃣ Ambil data 1 jam terakhir (agregasi 1 menit)
export const getLastHourAverages = async (_req: Request, res: Response) => {
  try {
    const data = await prisma.$queryRawUnsafe(`
      SELECT time_bucket('1 minute', "timestamp") AS bucket,
             avg(ampere_rs) AS avg_ampere_rs,
             avg(ampere_st) AS avg_ampere_st,
             avg(ampere_tr) AS avg_ampere_tr,
             avg(oil_pressure) AS avg_oil_pressure,
             avg(oil_temperature) AS avg_oil_temperature
      FROM measurements
      WHERE "timestamp" > now() - interval '1 hour'
      GROUP BY bucket
      ORDER BY bucket;
    `);

    return successResponse(res, 'Last hour averages fetched', data);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch hourly averages', 500, err);
  }
};

// 🔹 4️⃣ Ambil data dengan interval dinamis (misal 6 jam, 10 menit)
export const getMeasurementsByInterval = async (
  req: Request,
  res: Response,
) => {
  try {
    const { duration = '1 hour', bucket = '1 minute' } = req.query;

    const data = await prisma.$queryRawUnsafe(`
      SELECT time_bucket('${bucket}', "timestamp") AS bucket,
             avg(ampere_rs) AS avg_ampere_rs,
             avg(ampere_st) AS avg_ampere_st,
             avg(ampere_tr) AS avg_ampere_tr,
             avg(oil_pressure) AS avg_oil_pressure,
             avg(oil_temperature) AS avg_oil_temperature
      FROM measurements
      WHERE "timestamp" > now() - interval '${duration}'
      GROUP BY bucket
      ORDER BY bucket;
    `);

    return successResponse(
      res,
      `Measurements averaged every ${bucket} for ${duration}`,
      data,
    );
  } catch (err) {
    console.error(err);
    return errorResponse(
      res,
      'Failed to fetch measurements by interval',
      500,
      err,
    );
  }
};

export const getMeasurementsDynamic = async (req: Request, res: Response) => {
  try {
    console.log('🚀 ~ getMeasurementsDynamic ~ req.query:', req.query);
    const parsed = dynamicMeasurementSchema.safeParse(req.query);
    const queryParams = parsed.success
      ? parsed.data
      : dynamicMeasurementSchema.parse({});

    const {
      aggregate,
      bucket,
      duration,
      startDate,
      endDate,
      limit,
      order = 'desc',
      area,
    } = queryParams;

    const orderBy = order === 'asc' ? 'ASC' : 'DESC';
    const bucketStr = bucket.replace(/_/g, ' ');

    const whereClauses: string[] = [`area = '${area}'`];

    if (startDate && endDate) {
      whereClauses.push(`"timestamp" BETWEEN '${startDate}' AND '${endDate}'`);
    } else if (duration) {
      whereClauses.push(`"timestamp" > now() - interval '${duration}'`);
    } else {
      whereClauses.push(`"timestamp" > now() - interval '50 seconds'`);
    }

    const whereClause = whereClauses.length
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    // 🧩 Bagian ini menentukan LIMIT hanya jika disediakan
    const limitClause = limit ? `LIMIT ${limit}` : '';

    let query = '';

    if (aggregate === 'none') {
      query = `
        SELECT 
          date_trunc('second', "timestamp") AS timestamp,
          area,
          ampere_rs, ampere_st, ampere_tr,
          volt_rs, volt_st, volt_tr,
          pf, kwh,
          oil_pressure, oil_temperature
        FROM measurements
        ${whereClause}
        ORDER BY "timestamp" ${orderBy}
        ${limitClause};
      `;
    } else {
      query = `
        SELECT 
          area,
          time_bucket('${bucketStr}', date_trunc('second', "timestamp")) AS bucket,
          ${aggregate}(ampere_rs) AS ${aggregate}_ampere_rs,
          ${aggregate}(ampere_st) AS ${aggregate}_ampere_st,
          ${aggregate}(ampere_tr) AS ${aggregate}_ampere_tr,
          ${aggregate}(volt_rs) AS ${aggregate}_volt_rs,
          ${aggregate}(volt_st) AS ${aggregate}_volt_st,
          ${aggregate}(volt_tr) AS ${aggregate}_volt_tr,
          ${aggregate}(pf) AS ${aggregate}_pf,
          ${aggregate}(kwh) AS ${aggregate}_kwh,
          ${aggregate}(oil_pressure) AS ${aggregate}_oil_pressure,
          ${aggregate}(oil_temperature) AS ${aggregate}_oil_temperature
        FROM measurements
        ${whereClause}
        GROUP BY area, bucket
        ORDER BY bucket ${orderBy}
        ${limitClause};
      `;
    }

    const data = await prisma.$queryRawUnsafe(query);
    return successResponse(res, 'Dynamic measurements fetched', data);
  } catch (err: any) {
    console.error('🔥 Controller Error:', err);
    return errorResponse(res, 'Failed to fetch dynamic measurements', 500, err);
  }
};
