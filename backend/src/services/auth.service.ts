import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/prisma.js';
import { config } from '../config/env.js';
import { redis } from '../config/redis.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

// ── Registration ──────────────────────────────────────────────────────────────

export async function registerUser(params: {
  email: string;
  password: string;
  handle: string;
  displayName?: string;
}) {
  const { email, password, handle, displayName } = params;

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { profile: { handle } },
      ],
    },
    include: { profile: true },
  });

  if (existing) {
    if (existing.email === email) throw new ConflictError('Email already registered');
    throw new ConflictError('Handle already taken');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: false,
      status: 'PENDING_VERIFICATION',
      role: 'USER',
      profile: {
        create: {
          handle,
          displayName: displayName ?? handle,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  logger.info({ userId: user.id }, 'User registered');

  return user;
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.status === 'SUSPENDED') {
    throw new UnauthorizedError('Account suspended');
  }

  if (user.status === 'DELETED') {
    throw new UnauthorizedError('Account not found');
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return user;
}

// ── Token management ──────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
) {
  const refreshToken = uuidv4();
  const refreshTokenHash = await argon2.hash(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.session.create({
    data: {
      userId,
      refreshToken: refreshToken, // stored for lookup; hash stored on user
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  // Also store hash on user for quick validation
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash },
  });

  return refreshToken;
}

export async function invalidateSession(refreshToken: string) {
  await prisma.session.deleteMany({
    where: { refreshToken },
  });
}

export async function invalidateAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
}

// ── Token blacklist (Redis) ───────────────────────────────────────────────────

export async function blacklistToken(jti: string, expiresIn: number) {
  await redis.setex(`blacklist:${jti}`, expiresIn, '1');
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const val = await redis.get(`blacklist:${jti}`);
  return val === '1';
}

// ── Email verification ────────────────────────────────────────────────────────

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = uuidv4();
  await redis.setex(`email_verify:${token}`, 86400, userId); // 24h
  return token;
}

export async function verifyEmailToken(token: string) {
  const userId = await redis.get(`email_verify:${token}`);
  if (!userId) throw new UnauthorizedError('Invalid or expired verification token');

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
    include: { profile: true },
  });

  await redis.del(`email_verify:${token}`);
  return user;
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null; // Don't reveal if email exists

  const token = uuidv4();
  await redis.setex(`pwd_reset:${token}`, 3600, user.id); // 1h
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const userId = await redis.get(`pwd_reset:${token}`);
  if (!userId) throw new UnauthorizedError('Invalid or expired reset token');

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await redis.del(`pwd_reset:${token}`);
  await invalidateAllSessions(userId);
}
