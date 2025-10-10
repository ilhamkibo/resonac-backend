import { Request, Response } from 'express';
import prisma from '../config/db';
import { successResponse, errorResponse } from '../lib/response/response';

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
