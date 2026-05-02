import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from '../services/auth.service.js';
import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from '../utils/validators.js';

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const body = RegisterSchema.parse(request.body);

  const user = await authService.registerUser(body);

  // Create email verification token (skip in dev)
  const verifyToken = await authService.createEmailVerificationToken(user.id);

  // TODO: Send verification email
  request.log.info({ userId: user.id, verifyToken }, 'Verification token created');

  return reply.status(201).send(
    success({ userId: user.id, email: user.email }, 'Registration successful. Please verify your email.')
  );
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = LoginSchema.parse(request.body);

  const user = await authService.loginUser(email, password);

  const accessToken = (request.server as any).jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    { expiresIn: '15m' }
  );

  const refreshToken = await authService.createSession(
    user.id,
    request.headers['user-agent'],
    request.ip
  );

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      resource: 'session',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    },
  });

  return reply.send(
    success({
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profile: user.profile,
      },
    }, 'Login successful')
  );
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = RefreshTokenSchema.parse(request.body);

  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: { include: { profile: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { refreshToken } });
    return reply.status(401).send({ success: false, error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' } });
  }

  const { user } = session;

  const accessToken = (request.server as any).jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    { expiresIn: '15m' }
  );

  // Rotate refresh token
  const newRefreshToken = await authService.createSession(
    user.id,
    request.headers['user-agent'],
    request.ip
  );
  await prisma.session.delete({ where: { id: session.id } });

  return reply.send(
    success({ accessToken, refreshToken: newRefreshToken, expiresIn: 900 })
  );
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const { refreshToken } = RefreshTokenSchema.parse(request.body);
  await authService.invalidateSession(refreshToken);

  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: 'LOGOUT',
      resource: 'session',
      ipAddress: request.ip,
    },
  });

  return reply.send(success(null, 'Logged out successfully'));
}

export async function verifyEmail(request: FastifyRequest, reply: FastifyReply) {
  const { token } = VerifyEmailSchema.parse(request.query);
  const user = await authService.verifyEmailToken(token);
  return reply.send(success({ email: user.email }, 'Email verified successfully'));
}

export async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  const { email } = ForgotPasswordSchema.parse(request.body);
  const token = await authService.createPasswordResetToken(email);

  // TODO: Send password reset email with token
  if (token) {
    request.log.info({ email }, 'Password reset token created');
  }

  // Always respond the same way to prevent email enumeration
  return reply.send(success(null, 'If that email exists, a reset link has been sent.'));
}

export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const { token, password } = ResetPasswordSchema.parse(request.body);
  await authService.resetPassword(token, password);
  return reply.send(success(null, 'Password reset successfully'));
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  const user = await prisma.user.findUnique({
    where: { id: request.userId },
    include: { profile: true },
    omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
  });

  if (!user) throw new NotFoundError('User');

  return reply.send(success(user));
}
