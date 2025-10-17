import jwt from 'jsonwebtoken';

// const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';

const ACCESS_TOKEN_SECRET = 'resonacaccestoken25';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

interface JwtPayload {
  userId: number;
  role: string;
  email: string;
}
export const generateAccessToken = (
  userId: number,
  role: string,
  email: string,
) => {
  const payload: JwtPayload = { userId, role, email };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};
