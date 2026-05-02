import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { success, paginated } from '../utils/response.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { CreatePostSchema, UpdatePostSchema, CreateCommentSchema, PaginationSchema } from '../utils/validators.js';

// ─── Feed ─────────────────────────────────────────────────────────────────────

export async function getFeed(request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const { intent, domain } = request.query as { intent?: string; domain?: string };
  const skip = (page - 1) * limit;

  const where: any = {
    visibility: 'PUBLIC',
    deletedAt: null,
    scheduledAt: null,
  };

  if (intent && intent !== 'all') {
    where.intentTag = intent;
  }
  if (domain) {
    where.domainTag = { contains: domain, mode: 'insensitive' };
  }

  // If authenticated, also include followers' posts
  if (request.userId) {
    const followingIds = await prisma.follow.findMany({
      where: { followerId: request.userId },
      select: { followingId: true },
    });
    const ids = followingIds.map((f) => f.followingId);

    if (ids.length > 0 && (!intent || intent === 'all') && !domain) {
      delete where.visibility;
      where.OR = [
        { visibility: 'PUBLIC' },
        { userId: { in: ids } },
      ];
    }
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } },
        media: { include: { media: true }, orderBy: { order: 'asc' } },
        poll: { include: { options: true } },
        _count: { select: { comments: true, likes: true, reposts: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  // Attach liked/bookmarked status
  let likedIds = new Set<string>();
  let bookmarkedIds = new Set<string>();

  if (request.userId && posts.length > 0) {
    const ids = posts.map((p) => p.id);
    const [likes, bookmarks] = await prisma.$transaction([
      prisma.like.findMany({ where: { userId: request.userId, postId: { in: ids } }, select: { postId: true } }),
      prisma.bookmark.findMany({ where: { userId: request.userId, postId: { in: ids } }, select: { postId: true } }),
    ]);
    likedIds = new Set(likes.map((l) => l.postId));
    bookmarkedIds = new Set(bookmarks.map((b) => b.postId));
  }

  const enriched = posts.map((p) => ({
    ...p,
    isLiked: likedIds.has(p.id),
    isBookmarked: bookmarkedIds.has(p.id),
  }));

  return reply.send(paginated(enriched, total, page, limit));
}

// ─── Create Post ──────────────────────────────────────────────────────────────

export async function createPost(request: FastifyRequest, reply: FastifyReply) {
  const body = CreatePostSchema.parse(request.body);

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        userId: request.userId,
        type: body.type as any,
        text: body.text,
        visibility: body.visibility as any,
        intentTag: body.intentTag as any,
        domainTag: body.domainTag,
        isAnonymous: body.isAnonymous,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        forkParentId: body.forkParentId,
        forkDepth: body.forkParentId ? 1 : 0,
        publishedAt: body.scheduledAt ? undefined : new Date(),
      },
      include: {
        user: { include: { profile: true } },
        poll: { include: { options: true } },
      },
    });

    // Create poll if provided
    if (body.poll) {
      await tx.poll.create({
        data: {
          postId: created.id,
          userId: request.userId,
          question: body.poll.question,
          endsAt: body.poll.endsAt ? new Date(body.poll.endsAt) : undefined,
          options: {
            create: body.poll.options.map((label, order) => ({ label, order })),
          },
        },
      });
    }

    // Handle media
    if (body.mediaIds?.length) {
      await tx.postMedia.createMany({
        data: body.mediaIds.map((mediaId, order) => ({
          postId: created.id,
          mediaId,
          order,
        })),
      });
    }

    // Increment post count
    await tx.profile.update({
      where: { userId: request.userId },
      data: { postsCount: { increment: 1 } },
    });

    // Update fork parent
    if (body.forkParentId) {
      await tx.post.update({
        where: { id: body.forkParentId },
        data: { repostsCount: { increment: 1 } },
      });
    }

    return created;
  });

  return reply.status(201).send(success(post, 'Post created'));
}

// ─── Get Single Post ──────────────────────────────────────────────────────────

export async function getPost(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;

  const post = await prisma.post.findUnique({
    where: { id: postId, deletedAt: null },
    include: {
      user: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } },
      media: { include: { media: true } },
      poll: { include: { options: true } },
      _count: { select: { comments: true, likes: true, reposts: true } },
    },
  });

  if (!post) throw new NotFoundError('Post');

  // Increment view count
  await prisma.post.update({ where: { id: postId }, data: { viewsCount: { increment: 1 } } });

  const isLiked = request.userId
    ? !!(await prisma.like.findUnique({ where: { postId_userId: { postId, userId: request.userId } } }))
    : false;

  const isBookmarked = request.userId
    ? !!(await prisma.bookmark.findUnique({ where: { postId_userId: { postId, userId: request.userId } } }))
    : false;

  return reply.send(success({ ...post, isLiked, isBookmarked }));
}

// ─── Update Post ──────────────────────────────────────────────────────────────

export async function updatePost(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;
  const body = UpdatePostSchema.parse(request.body);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');
  if (post.userId !== request.userId) throw new ForbiddenError();

  const updated = await prisma.post.update({
    where: { id: postId },
    data: body,
  });

  return reply.send(success(updated, 'Post updated'));
}

// ─── Delete Post ──────────────────────────────────────────────────────────────

export async function deletePost(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');
  if (post.userId !== request.userId && request.userRole !== 'ADMIN') {
    throw new ForbiddenError();
  }

  await prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });

  return reply.send(success(null, 'Post deleted'));
}

// ─── Like / Unlike ────────────────────────────────────────────────────────────

export async function likePost(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;

  await prisma.$transaction(async (tx) => {
    await tx.like.create({ data: { postId, userId: request.userId } });
    await tx.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });

    const post = await tx.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== request.userId) {
      await tx.notification.create({
        data: {
          userId: post.userId,
          type: 'LIKE',
          title: 'New like',
          body: 'Someone liked your post',
          actorId: request.userId,
          resourceId: postId,
        },
      });
    }
  });

  return reply.send(success(null, 'Liked'));
}

export async function unlikePost(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;

  await prisma.$transaction([
    prisma.like.delete({ where: { postId_userId: { postId, userId: request.userId } } }),
    prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
  ]);

  return reply.send(success(null, 'Unliked'));
}

// ─── Bookmark ─────────────────────────────────────────────────────────────────

export async function bookmarkPost(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;

  await prisma.$transaction([
    prisma.bookmark.create({ data: { postId, userId: request.userId } }),
    prisma.post.update({ where: { id: postId }, data: { bookmarksCount: { increment: 1 } } }),
  ]);

  return reply.send(success(null, 'Bookmarked'));
}

export async function unbookmarkPost(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;

  await prisma.$transaction([
    prisma.bookmark.delete({ where: { postId_userId: { postId, userId: request.userId } } }),
    prisma.post.update({ where: { id: postId }, data: { bookmarksCount: { decrement: 1 } } }),
  ]);

  return reply.send(success(null, 'Unbookmarked'));
}

// ─── Repost ───────────────────────────────────────────────────────────────────

export async function repost(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;
  const { quote } = (request.body ?? {}) as { quote?: string };

  await prisma.$transaction([
    prisma.repost.create({ data: { postId, userId: request.userId, quote } }),
    prisma.post.update({ where: { id: postId }, data: { repostsCount: { increment: 1 } } }),
  ]);

  return reply.send(success(null, 'Reposted'));
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(request: FastifyRequest<{ Params: { postId: string }, Querystring: Record<string, string> }>, reply: FastifyReply) {
  const { postId } = request.params;
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { postId, parentId: null, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        user: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } },
        replies: {
          where: { deletedAt: null },
          include: {
            user: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 3,
        },
        _count: { select: { replies: true } },
      },
    }),
    prisma.comment.count({ where: { postId, parentId: null, deletedAt: null } }),
  ]);

  return reply.send(paginated(comments, total, page, limit));
}

export async function addComment(request: FastifyRequest<{ Params: { postId: string } }>, reply: FastifyReply) {
  const { postId } = request.params;
  const body = CreateCommentSchema.parse(request.body);

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: {
        postId,
        userId: request.userId,
        text: body.text,
        parentId: body.parentId,
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    await tx.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });

    const post = await tx.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (post && post.userId !== request.userId) {
      await tx.notification.create({
        data: {
          userId: post.userId,
          type: 'COMMENT',
          title: 'New comment',
          body: body.text.substring(0, 100),
          actorId: request.userId,
          resourceId: postId,
        },
      });
    }

    return created;
  });

  return reply.status(201).send(success(comment, 'Comment added'));
}

export async function deleteComment(request: FastifyRequest<{ Params: { commentId: string } }>, reply: FastifyReply) {
  const { commentId } = request.params;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError('Comment');
  if (comment.userId !== request.userId && request.userRole !== 'ADMIN') throw new ForbiddenError();

  await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });

  return reply.send(success(null, 'Comment deleted'));
}

// ─── User Posts ───────────────────────────────────────────────────────────────

export async function getUserPosts(request: FastifyRequest<{ Params: { userId: string }, Querystring: Record<string, string> }>, reply: FastifyReply) {
  const { userId } = request.params;
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const isOwner = request.userId === userId;
  const where: any = {
    userId,
    deletedAt: null,
    scheduledAt: null,
    ...(!isOwner && { visibility: 'PUBLIC' }),
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media: { include: { media: true } },
        poll: { include: { options: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return reply.send(paginated(posts, total, page, limit));
}

// ─── Trending ─────────────────────────────────────────────────────────────────

export async function getTrending(request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24h

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where: {
        visibility: 'PUBLIC',
        deletedAt: null,
        createdAt: { gte: since },
      },
      skip,
      take: limit,
      orderBy: [{ likesCount: 'desc' }, { commentsCount: 'desc' }, { viewsCount: 'desc' }],
      include: {
        user: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } },
        _count: { select: { comments: true, likes: true } },
      },
    }),
    prisma.post.count({
      where: { visibility: 'PUBLIC', deletedAt: null, createdAt: { gte: since } },
    }),
  ]);

  return reply.send(paginated(posts, total, page, limit));
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function getBookmarks(request: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await prisma.$transaction([
    prisma.bookmark.findMany({
      where: { userId: request.userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            user: { include: { profile: true }, omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true } },
            _count: { select: { comments: true, likes: true } },
          },
        },
      },
    }),
    prisma.bookmark.count({ where: { userId: request.userId } }),
  ]);

  return reply.send(paginated(bookmarks.map((b) => b.post), total, page, limit));
}
