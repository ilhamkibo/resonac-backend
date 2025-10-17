import prisma from '../config/db';
import { Prisma } from '../generated/prisma';

// Tipe untuk query parameter API (tidak ada perubahan)
export interface UserQuery {
  status?: 'approved' | 'unapproved' | 'all';
  role?: string;
  page?: string;
  limit?: string;
}

// Fungsi utama (tidak ada perubahan, sudah benar)
export async function getAllUsers(query: UserQuery = {}) {
  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '10');
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

  if (query.role) {
    where.role = query.role as any;
  }

  if (query.status === 'approved') {
    where.isApproved = true;
  } else if (query.status === 'unapproved') {
    where.isApproved = false;
  } else if (!query.status) {
    where.isApproved = true;
  }

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      created_at: 'desc',
    },
  });

  const totalUsers = await prisma.user.count({ where });

  return {
    data: users,
    pagination: {
      page,
      limit,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    },
  };
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}
