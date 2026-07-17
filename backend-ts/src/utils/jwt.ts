import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Types } from 'mongoose';

export interface TokenPayload extends JwtPayload {
  id: string;
}

export function generateToken(id: Types.ObjectId | string): string {
  return jwt.sign({ id: String(id) }, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  } as SignOptions);
}

export function generateRefreshToken(id: Types.ObjectId | string): string {
  return jwt.sign({ id: String(id) }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpire,
  } as SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
  } catch {
    return null;
  }
}
