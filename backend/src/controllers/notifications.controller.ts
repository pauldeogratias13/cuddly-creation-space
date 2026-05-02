import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { success, paginated } from '../utils/response.js';
import { PaginationSchema } from '../utils/validators.js';

export async function getNotifications(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId: request.userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId: request.userId } }),
  ]);

  // Enrich with actor profile if actorId present
  const actorIds = [...new Set(notifications.map((n) => n.actorId).filter(Boolean) as string[])];
  let actorMap: Record<string, any> = {};

  if (actorIds.length > 0) {
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, profile: true },
    });
    actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));
  }

  const enriched = notifications.map((n) => ({
    ...n,
    actor: n.actorId ? (actorMap[n.actorId] ?? null) : null,
  }));

  return reply.send(paginated(enriched, total, page, limit));
}

export async function getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
  const count = await prisma.notification.count({
    where: { userId: request.userId, readAt: null },
  });
  return reply.send(success({ count }));
}

export async function markRead(
  request: FastifyRequest<{ Params: { notificationId: string } }>,
  reply: FastifyReply
) {
  const { notificationId } = request.params;

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: request.userId },
    data: { readAt: new Date() },
  });

  return reply.send(success(null, 'Marked as read'));
}

export async function markAllRead(request: FastifyRequest, reply: FastifyReply) {
  await prisma.notification.updateMany({
    where: { userId: request.userId, readAt: null },
    data: { readAt: new Date() },
  });
  return reply.send(success(null, 'All marked as read'));
}

export async function deleteNotification(
  request: FastifyRequest<{ Params: { notificationId: string } }>,
  reply: FastifyReply
) {
  await prisma.notification.deleteMany({
    where: { id: request.params.notificationId, userId: request.userId },
  });
  return reply.send(success(null, 'Notification deleted'));
}
