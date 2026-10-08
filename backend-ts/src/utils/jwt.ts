import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import type { Types } from 'mongoose';

export interface TokenPayload extends JwtPayload {
  id: string;
  role?: string;
  jti?: string;
  tokenVersion?: number;
}

export function generateToken(id: Types.ObjectId | string, role?: string, tokenVersion?: number): string {
  const payload: { id: string; role?: string; tokenVersion?: number } = { id: String(id) };
  if (role) payload.role = role;
  if (tokenVersion !== undefined) payload.tokenVersion = tokenVersion;
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  } as SignOptions);
}

export function generateRefreshToken(id: Types.ObjectId | string, jti?: string, tokenVersion?: number): string {
  const tokenId = jti || crypto.randomUUID();
  const payload: { id: string; jti: string; tokenVersion?: number } = { id: String(id), jti: tokenId };
  if (tokenVersion !== undefined) payload.tokenVersion = tokenVersion;
  return jwt.sign(payload, env.jwtRefreshSecret, {
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
