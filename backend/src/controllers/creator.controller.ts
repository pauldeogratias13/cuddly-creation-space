import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { success, paginated } from '../utils/response.js';
import { PaginationSchema, CreateTierSchema } from '../utils/validators.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

// ─── Creator onboarding ───────────────────────────────────────────────────────

export async function onboardCreator(request: FastifyRequest, reply: FastifyReply) {
  // Elevate user role to CREATOR and set isCreator on profile
  await prisma.$transaction([
    prisma.user.update({
      where: { id: request.userId },
      data: { role: 'CREATOR' },
    }),
    prisma.profile.update({
      where: { userId: request.userId },
      data: { isCreator: true },
    }),
  ]);

  const profile = await prisma.profile.findUnique({ where: { userId: request.userId } });
  return reply.send(success(profile, 'Creator account activated'));
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

export async function getTiers(
  request: FastifyRequest<{ Params: { creatorId: string } }>,
  reply: FastifyReply
) {
  const tiers = await prisma.creatorTier.findMany({
    where: { creatorId: request.params.creatorId, isActive: true },
    orderBy: { price: 'asc' },
  });
  return reply.send(success(tiers));
}

export async function createTier(request: FastifyRequest, reply: FastifyReply) {
  const body = CreateTierSchema.parse(request.body);

  const tier = await prisma.creatorTier.create({
    data: {
      creatorId: request.userId,
      name: body.name,
      description: body.description,
      price: body.price,
      currency: body.currency ?? 'USD',
      benefits: body.benefits ?? [],
    },
  });
  return reply.status(201).send(success(tier, 'Tier created'));
}

export async function updateTier(
  request: FastifyRequest<{ Params: { tierId: string } }>,
  reply: FastifyReply
) {
  const { tierId } = request.params;
  const tier = await prisma.creatorTier.findUnique({ where: { id: tierId } });
  if (!tier) throw new NotFoundError('Tier');
  if (tier.creatorId !== request.userId) throw new ForbiddenError();

  const updated = await prisma.creatorTier.update({
    where: { id: tierId },
    data: request.body as any,
  });
  return reply.send(success(updated, 'Tier updated'));
}

export async function deleteTier(
  request: FastifyRequest<{ Params: { tierId: string } }>,
  reply: FastifyReply
) {
  const { tierId } = request.params;
  const tier = await prisma.creatorTier.findUnique({ where: { id: tierId } });
  if (!tier) throw new NotFoundError('Tier');
  if (tier.creatorId !== request.userId) throw new ForbiddenError();

  await prisma.creatorTier.update({ where: { id: tierId }, data: { isActive: false } });
  return reply.send(success(null, 'Tier removed'));
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function subscribe(
  request: FastifyRequest<{ Params: { creatorId: string } }>,
  reply: FastifyReply
) {
  const { creatorId } = request.params;
  const { tierId } = (request.body ?? {}) as { tierId?: string };

  // Make sure the creator exists
  const creator = await prisma.user.findUnique({ where: { id: creatorId } });
  if (!creator) throw new NotFoundError('Creator');

  const sub = await prisma.creatorSubscription.upsert({
    where: { subscriberId_creatorId: { subscriberId: request.userId, creatorId } },
    create: {
      subscriberId: request.userId,
      creatorId,
      tierId,
      active: true,
      autoRenew: true,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      active: true,
      tierId,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      userId: creatorId,
      type: 'SUBSCRIBE',
      title: 'New subscriber!',
      body: 'Someone subscribed to your content',
      actorId: request.userId,
      resourceId: sub.id,
    },
  });

  return reply.send(success(sub, 'Subscribed'));
}

export async function unsubscribe(
  request: FastifyRequest<{ Params: { creatorId: string } }>,
  reply: FastifyReply
) {
  const { creatorId } = request.params;

  await prisma.creatorSubscription.updateMany({
    where: { subscriberId: request.userId, creatorId },
    data: { active: false, cancelAtPeriodEnd: true },
  });

  return reply.send(success(null, 'Unsubscribed'));
}

export async function getMySubscriptions(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [subs, total] = await prisma.$transaction([
    prisma.creatorSubscription.findMany({
      where: { subscriberId: request.userId, active: true },
      skip,
      take: limit,
      include: {
        creator: { include: { profile: true } },
        tier: true,
      },
    }),
    prisma.creatorSubscription.count({ where: { subscriberId: request.userId, active: true } }),
  ]);

  return reply.send(paginated(subs, total, page, limit));
}

export async function getSubscribers(
  request: FastifyRequest<{ Params: { creatorId: string }; Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { creatorId } = request.params;
  if (creatorId !== request.userId && request.userRole !== 'ADMIN') throw new ForbiddenError();

  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [subs, total] = await prisma.$transaction([
    prisma.creatorSubscription.findMany({
      where: { creatorId, active: true },
      skip,
      take: limit,
      include: {
        subscriber: { include: { profile: true } },
        tier: true,
      },
    }),
    prisma.creatorSubscription.count({ where: { creatorId, active: true } }),
  ]);

  return reply.send(paginated(subs, total, page, limit));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics(request: FastifyRequest, reply: FastifyReply) {
  const [subscriberCount, postCount, viewsAgg, earningsAgg] = await prisma.$transaction([
    prisma.creatorSubscription.count({ where: { creatorId: request.userId, active: true } }),
    prisma.post.count({ where: { userId: request.userId, deletedAt: null } }),
    prisma.post.aggregate({ where: { userId: request.userId }, _sum: { viewsCount: true } }),
    prisma.creatorEarning.aggregate({ where: { creatorId: request.userId }, _sum: { amount: true } }),
  ]);

  return reply.send(
    success({
      subscriberCount,
      postCount,
      totalViews: viewsAgg._sum.viewsCount ?? 0,
      totalEarnings: earningsAgg._sum.amount ?? 0,
    })
  );
}

// ─── Gated content ────────────────────────────────────────────────────────────

export async function getGatedContent(
  request: FastifyRequest<{ Params: { creatorId: string }; Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { creatorId } = request.params;
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const isSubscriber = request.userId
    ? !!(await prisma.creatorSubscription.findFirst({
        where: { subscriberId: request.userId, creatorId, active: true },
      }))
    : false;

  const where: any = { creatorId, isActive: true };
  if (!isSubscriber && creatorId !== request.userId) {
    where.accessLevel = 'PUBLIC';
  }

  const [content, total] = await prisma.$transaction([
    prisma.gatedContent.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.gatedContent.count({ where }),
  ]);

  return reply.send(paginated(content, total, page, limit));
}

export async function createGatedContent(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as any;

  const content = await prisma.gatedContent.create({
    data: {
      creatorId: request.userId,
      title: body.title,
      description: body.description,
      contentType: body.contentType,
      contentUrl: body.contentUrl,
      contentText: body.contentText,
      thumbnailUrl: body.thumbnailUrl,
      accessLevel: body.accessLevel ?? 'SUBSCRIBERS',
      price: body.price,
      currency: body.currency ?? 'USD',
    },
  });
  return reply.status(201).send(success(content, 'Content created'));
}
