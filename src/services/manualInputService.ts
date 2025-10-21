// src/services/manualInputService.ts

import prisma from '../config/db';
import { Prisma } from '../generated/prisma';
import {
  CreateManualInputPayload,
  GetManualInputsQuery,
} from '../validators/manualInputValidator';
import {
  set,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  subHours,
} from 'date-fns';

/**
 * Membuat entri manual input baru beserta detailnya.
 * Menggunakan transaksi untuk memastikan integritas data (semua atau tidak sama sekali).
 * @param payload Data yang sudah divalidasi oleh Zod.
 * @returns Entri manual_input yang baru dibuat.
 */
const getShiftBoundaries = (timestamp: Date) => {
  const inputDate = new Date(timestamp);
  const hour = inputDate.getHours();

  let shiftStart: Date;
  let shiftEnd: Date;

  if (hour >= 8 && hour < 20) {
    // Ini adalah Shift 1 (08:00 - 19:59)
    shiftStart = set(startOfDay(inputDate), { hours: 8 });
    shiftEnd = set(startOfDay(inputDate), {
      hours: 19,
      minutes: 59,
      seconds: 59,
    });
  } else {
    // Ini adalah Shift 2 (20:00 - 07:59)
    if (hour >= 20) {
      // Input dilakukan antara jam 20:00 - 23:59
      shiftStart = set(startOfDay(inputDate), { hours: 20 });
      shiftEnd = set(startOfDay(addDays(inputDate, 1)), {
        hours: 7,
        minutes: 59,
        seconds: 59,
      });
    } else {
      // Input dilakukan antara jam 00:00 - 07:59
      shiftStart = set(startOfDay(subDays(inputDate, 1)), { hours: 20 });
      shiftEnd = set(startOfDay(inputDate), {
        hours: 7,
        minutes: 59,
        seconds: 59,
      });
    }
  }

  return { shiftStart, shiftEnd };
};

export async function create(payload: CreateManualInputPayload) {
  // ✨ --- BLOK VALIDASI BARU --- ✨
  // 1. Tentukan batas waktu shift berdasarkan timestamp dari payload.
  const { shiftStart, shiftEnd } = getShiftBoundaries(payload.timestamp);

  const existingInput = await prisma.manualInput.findFirst({
    where: {
      timestamp: {
        gte: shiftStart,
        lte: shiftEnd,
      },
    },
    include: {
      user: {
        // Memberitahu Prisma untuk mengambil data user yang terkait
        select: {
          name: true, // Ambil nama user saja
          email: true,
        },
      },
    },
  });

  // ✨ 3. Jika sudah ada, lemparkan error 409 Conflict dengan pesan dinamis.
  if (existingInput) {
    // Ambil nama user, berikan fallback jika user-nya null (seharusnya tidak terjadi)
    const userName = existingInput.user?.name || 'seorang operator';
    const userEmail = existingInput.user?.email || 'seorang operator';

    const error: any = new Error(
      `Input untuk shift ini sudah pernah dikirim oleh ${userName} (${userEmail}).`,
    );
    error.statusCode = 409;
    throw error;
  }

  // 3. Jika sudah ada, lemparkan error 409 Conflict.
  if (existingInput) {
    const error: any = new Error('Input untuk shift ini sudah pernah dikirim.');
    error.statusCode = 409; // 409 Conflict adalah status yang tepat
    throw error;
  }
  // ✨ --- AKHIR BLOK VALIDASI --- ✨

  // 4. Jika tidak ada, lanjutkan proses create seperti biasa.
  return prisma.$transaction(async (tx) => {
    // ... (sisa kode create Anda tetap sama)
    const newManualInput = await tx.manualInput.create({
      data: {
        userId: payload.userId,
        timestamp: payload.timestamp,
      },
    });

    const detailsData = payload.details.map((detail) => ({
      ...detail,
      manualInputId: newManualInput.id,
    }));

    await tx.manualInputDetail.createMany({
      data: detailsData,
    });

    return newManualInput;
  });
}

/**
 * Mencari dan memfilter daftar manual input dengan pagination.
 * @param query Parameter query yang sudah divalidasi oleh Zod.
 * @returns Daftar data beserta metadata untuk pagination.
 */
export async function findMany(query: GetManualInputsQuery) {
  // Siapkan objek 'where' yang akan dibangun secara dinamis.
  const where: Prisma.ManualInputWhereInput = {};

  // --- Bangun Klausa Filter Dinamis ---

  if (query.userId) {
    where.userId = query.userId;
  }

  // Filter berdasarkan 'area' yang ada di tabel relasi 'details'.
  // Ini adalah cara Prisma yang benar untuk memfilter parent berdasarkan data child.
  if (query.area) {
    where.details = {
      some: {
        area: query.area,
      },
    };
  }

  // Terapkan filter waktu dari helper atau rentang kustom.
  const { period, startDate, endDate } = query;
  if (period) {
    const now = new Date();
    if (period === 'daily')
      where.timestamp = { gte: startOfDay(now), lte: endOfDay(now) };
    //   where.timestamp = { gte: subHours(now, 24), lte: now };
    if (period === 'weekly')
      where.timestamp = { gte: startOfWeek(now), lte: endOfWeek(now) };
    if (period === 'monthly')
      where.timestamp = { gte: startOfMonth(now), lte: endOfMonth(now) };
  } else if (startDate && endDate) {
    where.timestamp = { gte: startOfDay(startDate), lte: endOfDay(endDate) };
  }

  // Atur pagination.
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  // Gunakan transaksi untuk mengambil data dan total count dalam satu panggilan
  // agar konsisten dan efisien.
  const [data, total] = await prisma.$transaction([
    prisma.manualInput.findMany({
      where,
      //   skip,
      //   take: limit,
      orderBy: { timestamp: 'desc' },
      // Sertakan data detail dalam hasil query.
      include: {
        details: true,
      },
    }),
    prisma.manualInput.count({ where }),
  ]);

  return data;
  //   {
  //     meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  //   };
}
