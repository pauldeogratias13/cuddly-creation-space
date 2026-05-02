import { FastifyInstance } from 'fastify';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';

export async function searchRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { q, type = 'all', page = '1', limit = '20' } = request.query as Record<string, string>;

    if (!q || q.trim().length < 2) {
      return reply.send(success({ users: [], posts: [], products: [], hashtags: [] }));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const results: Record<string, any> = {};

    if (type === 'all' || type === 'users') {
      results.users = await prisma.profile.findMany({
        where: {
          OR: [
            { handle: { contains: q, mode: 'insensitive' } },
            { displayName: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: { user: { select: { id: true, role: true, emailVerified: true } } },
        skip,
        take,
      });
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await prisma.post.findMany({
        where: {
          text: { contains: q, mode: 'insensitive' },
          visibility: 'PUBLIC',
          deletedAt: null,
        },
        include: {
          user: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } },
          _count: { select: { likes: true, comments: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
    }

    if (type === 'all' || type === 'products') {
      results.products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        skip,
        take,
      });
    }

    if (type === 'all' || type === 'hashtags') {
      results.hashtags = await prisma.hashtag.findMany({
        where: { tag: { contains: q, mode: 'insensitive' } },
        orderBy: { postsCount: 'desc' },
        take,
      });
    }

    // Save to search history if user is authenticated
    if (request.userId) {
      prisma.searchHistory.create({
        data: { userId: request.userId, query: q },
      }).catch(() => {}); // fire and forget
    }

    return reply.send(success(results));
  });

  // Get search history for current user
  app.get('/history', { preHandler: [optionalAuth] }, async (request, reply) => {
    if (!request.userId) return reply.send(success([]));

    const history = await prisma.searchHistory.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return reply.send(success(history));
  });

  // Delete search history
  app.delete('/history', { preHandler: [optionalAuth] }, async (request, reply) => {
    if (!request.userId) return reply.send(success(null));
    await prisma.searchHistory.deleteMany({ where: { userId: request.userId } });
    return reply.send(success(null, 'History cleared'));
  });
}
