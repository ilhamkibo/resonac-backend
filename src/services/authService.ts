import prisma from '../config/db';
import bcrypt from 'bcrypt';
import { LoginSchema, RegisterSchema } from '../lib/validators/authValidator';
import { generateAccessToken } from '../lib/utils/jwt';

export const loginUser = async (input: LoginSchema) => {
  const { email, password } = input;

  // Cari user berdasarkan email
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
    },
  });

  // Cek user ada dan password cocok
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    // Pesan error sengaja dibuat sama untuk mencegah user enumeration
    throw new Error('Email atau password salah');
  }

  // Cek account sudah disetujui atau belum
  if (!user.isApproved) {
    throw new Error('Akun Anda belum disetujui oleh administrator');
  }

  // 4. ✅ [BEST PRACTICE] Buat token langsung di sini
  const accessToken = generateAccessToken(user.id, user.role, user.email);

  // 5. Hapus password dari objek user sebelum dikirim kembali
  const { password_hash: _, ...userWithoutPassword } = user;

  // 6. Kembalikan semua data yang sudah siap pakai
  return {
    user: userWithoutPassword,
    accessToken,
  };
};

export const registerUser = async (input: RegisterSchema) => {
  const { email, password, name } = input;

  // Cari user berdasarkan email
  const existingUser = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (existingUser) {
    throw new Error('Email sudah terdaftar');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Buat user baru
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      name,
      role: 'operator',
    },
  });

  return user;
};
