import { prisma } from '../config/prisma.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export async function getUserProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      user: {
        omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
      },
    },
  });
  if (!profile) throw new NotFoundError('User');
  return profile;
}

export async function updateProfile(userId: string, data: {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}) {
  return prisma.profile.update({
    where: { userId },
    data,
    include: { user: { omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } } },
  });
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error('Cannot follow yourself');

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (existing) throw new ConflictError('Already following');

  await prisma.$transaction([
    prisma.follow.create({ data: { followerId, followingId } }),
    prisma.profile.update({ where: { userId: followerId }, data: { followingCount: { increment: 1 } } }),
    prisma.profile.update({ where: { userId: followingId }, data: { followersCount: { increment: 1 } } }),
    prisma.notification.create({
      data: {
        userId: followingId,
        type: 'FOLLOW',
        title: 'New follower',
        body: 'Someone started following you',
        actorId: followerId,
        resourceId: followerId,
      },
    }),
  ]);
}

export async function unfollowUser(followerId: string, followingId: string) {
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (!existing) throw new NotFoundError('Follow relationship');

  await prisma.$transaction([
    prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } }),
    prisma.profile.update({ where: { userId: followerId }, data: { followingCount: { decrement: 1 } } }),
    prisma.profile.update({ where: { userId: followingId }, data: { followersCount: { decrement: 1 } } }),
  ]);
}

export async function getFollowers(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [followers, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: { followingId: userId },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { follower: { include: { profile: true } } },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);
  return { data: followers.map((f) => f.follower), total, page, limit };
}

export async function getFollowing(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [following, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: { followerId: userId },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { following: { include: { profile: true } } },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { data: following.map((f) => f.following), total, page, limit };
}

export async function getSuggestedUsers(userId: string, limit = 10) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  return prisma.user.findMany({
    where: {
      id: { notIn: [userId, ...followingIds] },
      status: 'ACTIVE',
    },
    include: { profile: true },
    take: limit,
    orderBy: { profile: { followersCount: 'desc' } },
  });
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error('Cannot block yourself');

  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    }),
    // Remove any follow relationships
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    }),
  ]);
}

export async function muteUser(muterId: string, mutedId: string) {
  await prisma.mute.upsert({
    where: { muterId_mutedId: { muterId, mutedId } },
    create: { muterId, mutedId },
    update: {},
  });
}
