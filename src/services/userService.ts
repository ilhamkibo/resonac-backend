import prisma from '../config/db';
import { Prisma } from '../generated/prisma';
import { UpdateUserInput, UserQuery } from '../validators/userValidator';

// Fungsi utama (tidak ada perubahan, sudah benar)
export async function getAllUsers(query: UserQuery) {
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
  } else {
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
  const usersWithoutPassword = users.map((user) => {
    const { password_hash, ...rest } = user;
    return rest;
  });
  return {
    data: usersWithoutPassword,
    meta: {
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

export async function updateUser(id: number, userData: UpdateUserInput) {
  return prisma.user.update({ where: { id }, data: userData });
}

export async function deleteUser(id: number) {
  return prisma.user.delete({ where: { id } });
}

export async function getUserStats() {
  const userCount = await prisma.user.count();
  const approvedUserCount = await prisma.user.count({
    where: { isApproved: true },
  });
  const unapprovedUserCount = await prisma.user.count({
    where: { isApproved: false },
  });
  return { userCount, approvedUserCount, unapprovedUserCount };
}
