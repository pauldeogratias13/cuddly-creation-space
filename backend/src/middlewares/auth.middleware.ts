import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    userRole: string;
    userEmail: string;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{
      sub: string;
      email: string;
      role: string;
      jti?: string;
    }>();

    request.userId = payload.sub;
    request.userRole = payload.role;
    request.userEmail = payload.email;
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const header = request.headers.authorization;
    if (!header) return;

    const payload = await request.jwtVerify<{
      sub: string;
      email: string;
      role: string;
    }>();

    request.userId = payload.sub;
    request.userRole = payload.role;
    request.userEmail = payload.email;
  } catch {
    // Optional — do not throw
  }
}

export function requireRole(...roles: string[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.userRole) throw new UnauthorizedError();
    if (!roles.includes(request.userRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireModerator = requireRole('ADMIN', 'MODERATOR');
export const requireCreator = requireRole('ADMIN', 'CREATOR');
