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
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns';
import { Parser } from 'json2csv';

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

    if (period === 'daily') {
      const hour = now.getHours();
      let start, end;

      if (hour < 8) {
        // Kalau masih sebelum jam 08:00 → ambil 08:00 kemarin s/d 08:00 hari ini
        start = setMilliseconds(
          setSeconds(setMinutes(setHours(subDays(now, 1), 8), 0), 0),
          0,
        );
        end = setMilliseconds(
          setSeconds(setMinutes(setHours(now, 8), 0), 0),
          0,
        );
      } else {
        // Kalau sudah lewat jam 08:00 → ambil 08:00 hari ini s/d 08:00 besok
        start = setMilliseconds(
          setSeconds(setMinutes(setHours(now, 8), 0), 0),
          0,
        );
        end = setMilliseconds(
          setSeconds(setMinutes(setHours(addDays(now, 1), 8), 0), 0),
          0,
        );
      }

      where.timestamp = { gte: start, lte: end };
    }

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
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
      // Sertakan data detail dalam hasil query.
      include: {
        details: true,
        user: true, // penting
      },
    }),
    prisma.manualInput.count({ where }),
  ]);

  // --- Mapping response ---
  const mappedData = data.map((item) => ({
    id: item.id,
    username: item.user?.name ?? null, // tampilkan nama sebagai 'username'
    timestamp: item.timestamp,
    details: item.details,
  }));

  return {
    data: mappedData,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// export async function exportCsv(query: GetManualInputsQuery) {
//   const where: Prisma.ManualInputWhereInput = {};

//   if (query.userId) {
//     where.userId = query.userId;
//   }

//   if (query.area) {
//     where.details = { some: { area: query.area } };
//   }

//   const { period, startDate, endDate } = query;
//   if (period) {
//     const now = new Date();
//     if (period === 'daily') {
//       const hour = now.getHours();
//       let start, end;
//       if (hour < 8) {
//         start = setMilliseconds(
//           setSeconds(setMinutes(setHours(subDays(now, 1), 8), 0), 0),
//           0,
//         );
//         end = setMilliseconds(
//           setSeconds(setMinutes(setHours(now, 8), 0), 0),
//           0,
//         );
//       } else {
//         start = setMilliseconds(
//           setSeconds(setMinutes(setHours(now, 8), 0), 0),
//           0,
//         );
//         end = setMilliseconds(
//           setSeconds(setMinutes(setHours(addDays(now, 1), 8), 0), 0),
//           0,
//         );
//       }
//       where.timestamp = { gte: start, lte: end };
//     }
//     if (period === 'weekly')
//       where.timestamp = { gte: startOfWeek(now), lte: endOfWeek(now) };
//     if (period === 'monthly')
//       where.timestamp = { gte: startOfMonth(now), lte: endOfMonth(now) };
//   } else if (startDate && endDate) {
//     where.timestamp = { gte: startOfDay(startDate), lte: endOfDay(endDate) };
//   }

//   const data = await prisma.manualInput.findMany({
//     where,
//     include: { details: true, user: true },
//     orderBy: { timestamp: 'desc' },
//   });

//   const flat = data.flatMap((item) =>
//     item.details.map((detail) => ({
//       username: item.user?.name ?? null,
//       timestamp: item.timestamp?.toLocaleString('id-ID'),
//       area: detail.area,
//     })),
//   );

//   const parser = new Parser();
//   return parser.parse(flat);
// }

export async function exportCsv(query: GetManualInputsQuery) {
  const where: Prisma.ManualInputWhereInput = {};

  if (query.userId) {
    where.userId = query.userId;
  }

  // Hanya filter berdasarkan area jika query.area diisi (opsional, tergantung kebutuhan)
  if (query.area) {
    where.details = { some: { area: query.area } };
  }

  // Terapkan filter waktu dari helper atau rentang kustom.
  const { period, startDate, endDate } = query;
  // --- Logika filter waktu tetap sama ---
  if (period) {
    const now = new Date();
    if (period === 'daily') {
      const hour = now.getHours();
      let start, end;
      if (hour < 8) {
        // ... (Logika subDays tetap sama)
        start = setMilliseconds(
          setSeconds(setMinutes(setHours(subDays(now, 1), 8), 0), 0),
          0,
        );
        end = setMilliseconds(
          setSeconds(setMinutes(setHours(now, 8), 0), 0),
          0,
        );
      } else {
        // ... (Logika addDays tetap sama)
        start = setMilliseconds(
          setSeconds(setMinutes(setHours(now, 8), 0), 0),
          0,
        );
        end = setMilliseconds(
          setSeconds(setMinutes(setHours(addDays(now, 1), 8), 0), 0),
          0,
        );
      }
      where.timestamp = { gte: start, lte: end };
    }
    if (period === 'weekly')
      where.timestamp = { gte: startOfWeek(now), lte: endOfWeek(now) };
    if (period === 'monthly')
      where.timestamp = { gte: startOfMonth(now), lte: endOfMonth(now) };
  } else if (startDate && endDate) {
    // Penting: Pastikan startDate dan endDate diparse sebagai Date object jika mereka string
    where.timestamp = {
      gte: startOfDay(new Date(startDate)),
      lte: endOfDay(new Date(endDate)),
    };
  }
  // --- Akhir Logika filter waktu ---

  // 1. Ambil SEMUA data (tanpa skip/take)
  const data = await prisma.manualInput.findMany({
    where,
    include: { details: true, user: true },
    orderBy: { timestamp: 'desc' },
  });

  // Jika data.length hanya 1 di hasil akhir, pastikan filter waktu di atas benar-benar mengembalikan banyak data.

  // --- Transformasi Data (Flattening / Pivoting) ---
  const flatData = data.map((item) => {
    // **HILANGKAN BLOK PERTAMA (forEach) YANG BERPOTENSI BINGUNG**
    // Karena kita sudah menggunakan pendekatan find() di bawah ini,
    // Blok forEach yang Anda kirimkan tidak diperlukan lagi.

    // --- SOLUSI PIVOT YANG BENAR (Berdasarkan Lookup/Find) ---
    // Mencari data detail yang relevan
    const mainPump = item.details.find((d) => d.area === 'main');
    const pilotPump = item.details.find((d) => d.area === 'pilot');
    const oilTemp = item.details.find((d) => d.area === 'oil');

    // Mengembalikan objek data yang diratakan (flat)
    return {
      Waktu: item.timestamp?.toLocaleString('id-ID'),
      Operator: item.user?.name ?? null,

      // MAIN PUMP (Menggunakan optional chaining dan nullish coalescing)
      Main_Ampere_R: mainPump?.ampere_r ?? '',
      Main_Ampere_S: mainPump?.ampere_s ?? '',
      Main_Ampere_T: mainPump?.ampere_t ?? '',
      Main_Oil_Pressure: mainPump?.oil_pressure ?? '',

      // PILOT PUMP
      Pilot_Ampere_R: pilotPump?.ampere_r ?? '',
      Pilot_Ampere_S: pilotPump?.ampere_s ?? '',
      Pilot_Ampere_T: pilotPump?.ampere_t ?? '',
      Pilot_Oil_Pressure: pilotPump?.oil_pressure ?? '',

      // OIL TEMP
      Oil_Temp: oilTemp?.oil_temperature ?? '',
    };
  });

  // 4. Definisikan field (header) untuk Parser agar urutannya benar
  const fields = [
    'Waktu',
    'Operator',
    'Main_Ampere_R',
    'Main_Ampere_S',
    'Main_Ampere_T',
    'Main_Oil_Pressure',
    'Pilot_Ampere_R',
    'Pilot_Ampere_S',
    'Pilot_Ampere_T',
    'Pilot_Oil_Pressure',
    'Oil_Temp',
  ];

  // 5. Buat parser dengan field yang sudah ditentukan
  const parser = new Parser({ fields });
  return parser.parse(flatData);
}
