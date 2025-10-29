import prisma from '../config/db';
import bcrypt from 'bcrypt';
import { LoginSchema, RegisterSchema } from '../validators/authValidator';
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
    const error: any = new Error('Email atau password salah');
    error.statusCode = 401;
    throw error;
  }

  // Cek account sudah disetujui atau belum
  if (!user.isApproved) {
    throw new Error('Akun Anda belum disetujui oleh administrator');
  }

  // 4. ✅ [BEST PRACTICE] Buat token langsung di sini
  const accessToken = generateAccessToken(
    user.id,
    user.role,
    user.email,
    user.name,
  );

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
    const error: any = new Error('Email sudah terdaftar! Silahkan login.');
    error.statusCode = 409;
    throw error;
  }

  const totalUser = await prisma.user.count();
  if (totalUser >= 10) {
    throw new Error('Pendaftaran sudah penuh');
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

  const { password_hash: _, ...userWithoutPassword } = user;

  return userWithoutPassword;
};
