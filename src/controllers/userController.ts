import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { asyncHandler } from '../lib/utils/asyncHandler';
import { successResponse } from '../lib/response/response';

export const handleGetAllUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await userService.getAllUsers(req.query as any);
    return successResponse(res, 'User list fetched successfully', result, 200);
  },
);

export const handleGetUserById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await userService.getUserById(id);
    return successResponse(res, 'User fetched successfully', result, 200);
  },
);
// export async function handleGetUserById(req: Request, res: Response) {
//   try {
//     // ID dari parameter URL (e.g., /users/123) selalu berupa string.
//     // Kita harus mengubahnya menjadi angka.
//     const id = parseInt(req.params.id);

//     // Validasi: Pastikan ID adalah angka yang valid.
//     if (isNaN(id)) {
//       return res.status(400).json({ message: 'ID harus berupa angka.' });
//     }

//     const user = await userService.getUserById(id);

//     // Jika user tidak ditemukan, service akan mengembalikan null.
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: `User dengan ID ${id} tidak ditemukan.` });
//     }

//     res.status(200).json(user);
//   } catch (error) {
//     console.error('Error in handleGetUserById:', error);
//     res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
//   }
// }
