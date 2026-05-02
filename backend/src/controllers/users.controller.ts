import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { success, paginated } from '../utils/response.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { UpdateProfileSchema, UpdateHandleSchema, PaginationSchema } from '../utils/validators.js';

export async function getUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const { userId } = request.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
    omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
  });

  if (!user) throw new NotFoundError('User');

  let isFollowing = false;
  if (request.userId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: request.userId, followingId: userId } },
    });
    isFollowing = !!follow;
  }

  return reply.send(success({ ...user, isFollowing }));
}

export async function getUserPosts(request: FastifyRequest<{ Params: { userId: string }, Querystring: Record<string, string> }>, reply: FastifyReply) {
  const { userId } = request.params;
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const isOwner = request.userId === userId;
  const where: any = { userId, deletedAt: null, scheduledAt: null, ...(!isOwner && { visibility: 'PUBLIC' }) };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { media: { include: { media: true } }, _count: { select: { comments: true, likes: true } } },
    }),
    prisma.post.count({ where }),
  ]);

  return reply.send(paginated(posts, total, page, limit));
}

export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  const body = UpdateProfileSchema.parse(request.body);
  const profile = await prisma.profile.update({ where: { userId: request.userId }, data: body });
  return reply.send(success(profile, 'Profile updated'));
}

export async function updateAvatar(request: FastifyRequest, reply: FastifyReply) {
  const { avatarUrl } = request.body as { avatarUrl: string };
  const profile = await prisma.profile.update({ where: { userId: request.userId }, data: { avatarUrl } });
  return reply.send(success(profile, 'Avatar updated'));
}

export async function updateBanner(request: FastifyRequest, reply: FastifyReply) {
  const { coverUrl } = request.body as { coverUrl: string };
  const profile = await prisma.profile.update({ where: { userId: request.userId }, data: { coverUrl } });
  return reply.send(success(profile, 'Banner updated'));
}

export async function followUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const { userId } = request.params;
  if (userId === request.userId) throw new ForbiddenError('Cannot follow yourself');

  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: request.userId, blockedId: userId }, { blockerId: userId, blockedId: request.userId }] },
  });
  if (blocked) throw new ForbiddenError('Cannot follow this user');

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: request.userId, followingId: userId } },
  });
  if (existing) throw new ConflictError('Already following');

  await prisma.$transaction([
    prisma.follow.create({ data: { followerId: request.userId, followingId: userId } }),
    prisma.profile.update({ where: { userId: request.userId }, data: { followingCount: { increment: 1 } } }),
    prisma.profile.update({ where: { userId }, data: { followersCount: { increment: 1 } } }),
    prisma.notification.create({ data: { userId, type: 'FOLLOW', title: 'New follower', body: 'Someone started following you', actorId: request.userId } }),
  ]);

  return reply.send(success(null, 'Following'));
}

export async function unfollowUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const { userId } = request.params;
  await prisma.follow.deleteMany({ where: { followerId: request.userId, followingId: userId } });
  await prisma.$transaction([
    prisma.profile.update({ where: { userId: request.userId }, data: { followingCount: { decrement: 1 } } }),
    prisma.profile.update({ where: { userId }, data: { followersCount: { decrement: 1 } } }),
  ]);
  return reply.send(success(null, 'Unfollowed'));
}

export async function getFollowers(request: FastifyRequest<{ Params: { userId: string }, Querystring: Record<string, string> }>, reply: FastifyReply) {
  const { userId } = request.params;
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [followers, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: { followingId: userId }, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: { follower: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } } },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);

  return reply.send(paginated(followers.map((f) => f.follower), total, page, limit));
}

export async function getFollowing(request: FastifyRequest<{ Params: { userId: string }, Querystring: Record<string, string> }>, reply: FastifyReply) {
  const { userId } = request.params;
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [following, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: { followerId: userId }, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: { following: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } } },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return reply.send(paginated(following.map((f) => f.following), total, page, limit));
}

export async function getSuggestions(request: FastifyRequest, reply: FastifyReply) {
  const following = await prisma.follow.findMany({ where: { followerId: request.userId }, select: { followingId: true } });
  const ids = following.map((f) => f.followingId);

  const suggestions = await prisma.user.findMany({
    where: { id: { notIn: [request.userId, ...ids] }, status: 'ACTIVE' },
    include: { profile: true },
    take: 10,
    orderBy: { profile: { followersCount: 'desc' } },
    omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
  });

  return reply.send(success(suggestions));
}

export async function blockUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const { userId } = request.params;
  if (userId === request.userId) throw new ForbiddenError();

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: request.userId, blockedId: userId } },
    create: { blockerId: request.userId, blockedId: userId },
    update: {},
  });
  await prisma.follow.deleteMany({
    where: { OR: [{ followerId: request.userId, followingId: userId }, { followerId: userId, followingId: request.userId }] },
  });
  return reply.send(success(null, 'User blocked'));
}

export async function unblockUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const { userId } = request.params;
  await prisma.block.deleteMany({ where: { blockerId: request.userId, blockedId: userId } });
  return reply.send(success(null, 'User unblocked'));
}

export async function muteUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const { userId } = request.params;
  await prisma.mute.upsert({
    where: { muterId_mutedId: { muterId: request.userId, mutedId: userId } },
    create: { muterId: request.userId, mutedId: userId },
    update: {},
  });
  return reply.send(success(null, 'User muted'));
}

export async function unmuteUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  const { userId } = request.params;
  await prisma.mute.deleteMany({ where: { muterId: request.userId, mutedId: userId } });
  return reply.send(success(null, 'User unmuted'));
}

export async function deleteAccount(request: FastifyRequest, reply: FastifyReply) {
  await prisma.user.update({ where: { id: request.userId }, data: { status: 'DELETED', deletedAt: new Date() } });
  return reply.send(success(null, 'Account scheduled for deletion'));
}
