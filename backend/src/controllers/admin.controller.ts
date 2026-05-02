import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { success, paginated } from '../utils/response.js';
import { PaginationSchema } from '../utils/validators.js';
import { NotFoundError } from '../utils/errors.js';

export async function getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
  const [
    totalUsers,
    activeUsers,
    totalPosts,
    totalOrders,
    pendingReports,
    newUsersToday,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ]);

  return reply.send(
    success({ totalUsers, activeUsers, totalPosts, totalOrders, pendingReports, newUsersToday })
  );
}

export async function getUsers(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const { q, status, role } = request.query as any;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { profile: { handle: { contains: q, mode: 'insensitive' } } },
      { profile: { displayName: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (status) where.status = status;
  if (role) where.role = role;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { profile: true },
      omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
    }),
    prisma.user.count({ where }),
  ]);

  return reply.send(paginated(users, total, page, limit));
}

export async function getUserDetail(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const user = await prisma.user.findUnique({
    where: { id: request.params.userId },
    include: {
      profile: true,
      sessions: { orderBy: { createdAt: 'desc' }, take: 5 },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
    omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
  });
  if (!user) throw new NotFoundError('User');
  return reply.send(success(user));
}

export async function suspendUser(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  const { reason } = (request.body ?? {}) as { reason?: string };

  await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });
  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: 'SUSPEND_USER',
      resource: 'user',
      resourceId: userId,
      metadata: { reason },
    },
  });
  return reply.send(success(null, 'User suspended'));
}

export async function unsuspendUser(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: 'UNSUSPEND_USER',
      resource: 'user',
      resourceId: userId,
    },
  });
  return reply.send(success(null, 'User unsuspended'));
}

export async function deleteUser(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  await prisma.user.update({ where: { id: userId }, data: { status: 'DELETED', deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: 'DELETE_USER',
      resource: 'user',
      resourceId: userId,
    },
  });
  return reply.send(success(null, 'User deleted'));
}

export async function verifyUser(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  await prisma.profile.update({ where: { userId }, data: { verified: true } });
  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: 'VERIFY_USER',
      resource: 'user',
      resourceId: userId,
    },
  });
  return reply.send(success(null, 'User verified'));
}

export async function getReports(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const { status = 'PENDING' } = request.query as any;
  const skip = (page - 1) * limit;

  const [reports, total] = await prisma.$transaction([
    prisma.report.findMany({
      where: { status },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { include: { profile: true } },
        reportedUser: { include: { profile: true } },
        post: { select: { id: true, text: true } },
      },
    }),
    prisma.report.count({ where: { status } }),
  ]);

  return reply.send(paginated(reports, total, page, limit));
}

export async function resolveReport(
  request: FastifyRequest<{ Params: { reportId: string } }>,
  reply: FastifyReply
) {
  const { reportId } = request.params;
  const { status } = (request.body ?? {}) as { status?: 'RESOLVED' | 'DISMISSED' };

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: status ?? 'RESOLVED',
      resolvedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: 'RESOLVE_REPORT',
      resource: 'report',
      resourceId: reportId,
    },
  });

  return reply.send(success(null, 'Report resolved'));
}

export async function deletePost(
  request: FastifyRequest<{ Params: { postId: string } }>,
  reply: FastifyReply
) {
  const { postId } = request.params;
  await prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: 'DELETE_POST',
      resource: 'post',
      resourceId: postId,
    },
  });
  return reply.send(success(null, 'Post removed'));
}

export async function getAuditLogs(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const { userId, action } = request.query as any;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: 'insensitive' };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: { profile: true },
          omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return reply.send(paginated(logs, total, page, limit));
}

export async function getModerationActions(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [actions, total] = await prisma.$transaction([
    prisma.moderationAction.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { moderator: { include: { profile: true } } },
    }),
    prisma.moderationAction.count(),
  ]);

  return reply.send(paginated(actions, total, page, limit));
}
