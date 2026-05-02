import { prisma } from '../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

// ─── Threads (conversations) ──────────────────────────────────────────────────

export async function getUserThreads(userId: string) {
  const participations = await prisma.threadParticipant.findMany({
    where: { userId },
    include: {
      thread: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  profile: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: { id: true, profile: true },
              },
            },
          },
        },
      },
    },
    orderBy: { thread: { lastMessageAt: 'desc' } },
  });

  return participations.map((p) => {
    const thread = p.thread;
    const lastMessage = thread.messages[0] ?? null;
    const unreadCount = p.lastReadAt && lastMessage
      ? (lastMessage.createdAt > p.lastReadAt ? 1 : 0)
      : (lastMessage ? 1 : 0);

    return {
      ...thread,
      messages: undefined,
      lastMessage,
      unreadCount,
      myParticipant: {
        isPinned: p.isPinned,
        isMuted: p.isMuted,
        isAdmin: p.isAdmin,
        lastReadAt: p.lastReadAt,
      },
    };
  });
}

export async function getOrCreateDMThread(userAId: string, userBId: string) {
  // Look for an existing non-group thread between exactly these two users
  const existing = await prisma.thread.findFirst({
    where: {
      isGroup: false,
      participants: {
        every: { userId: { in: [userAId, userBId] } },
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, profile: true } } } },
    },
  });

  if (existing) {
    // Validate it's exactly 2 participants
    if (existing.participants.length === 2) return existing;
  }

  return prisma.thread.create({
    data: {
      isGroup: false,
      isEncrypted: true,
      participants: {
        create: [{ userId: userAId }, { userId: userBId }],
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, profile: true } } } },
    },
  });
}

export async function createGroupThread(creatorId: string, memberIds: string[], title?: string) {
  const allIds = Array.from(new Set([creatorId, ...memberIds]));

  return prisma.thread.create({
    data: {
      isGroup: true,
      isEncrypted: true,
      title,
      participants: {
        create: allIds.map((userId) => ({
          userId,
          isAdmin: userId === creatorId,
        })),
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, profile: true } } } },
    },
  });
}

export async function getThreadById(threadId: string, userId: string) {
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!participant) throw new ForbiddenError('Not a participant');

  return prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      participants: { include: { user: { select: { id: true, profile: true } } } },
    },
  });
}

export async function leaveThread(threadId: string, userId: string) {
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!participant) throw new NotFoundError('Thread participant');

  // Delete the participant record (soft leave via delete, or you can keep it and add a leftAt)
  return prisma.threadParticipant.delete({
    where: { threadId_userId: { threadId, userId } },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getThreadMessages(threadId: string, userId: string, page: number, limit: number) {
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId } },
  });
  if (!participant) throw new ForbiddenError('Not a participant');

  const skip = (page - 1) * limit;

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where: { threadId, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
          include: { profile: true },
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, profile: true },
            },
          },
        },
      },
    }),
    prisma.message.count({ where: { threadId, deletedAt: null } }),
  ]);

  return { messages: messages.reverse(), total, page, limit };
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  data: { text?: string; mediaUrl?: string; replyToId?: string }
) {
  const participant = await prisma.threadParticipant.findUnique({
    where: { threadId_userId: { threadId, userId: senderId } },
  });
  if (!participant) throw new ForbiddenError('Not a participant');

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        threadId,
        senderId,
        text: data.text,
        mediaUrl: data.mediaUrl,
        replyToId: data.replyToId,
      },
      include: {
        sender: {
          omit: { passwordHash: true, twoFactorSecret: true, refreshTokenHash: true },
          include: { profile: true },
        },
        replyTo: {
          include: { sender: { select: { id: true, profile: true } } },
        },
      },
    });

    // Update thread's lastMessageAt
    await tx.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    // Notify other participants
    const others = await tx.threadParticipant.findMany({
      where: { threadId, userId: { not: senderId } },
      select: { userId: true, isMuted: true },
    });

    const notifData = others
      .filter((p) => !p.isMuted)
      .map((p) => ({
        userId: p.userId,
        type: 'SYSTEM' as const,
        title: 'New message',
        body: data.text?.substring(0, 80) ?? '📎 Media',
        actorId: senderId,
        resourceId: threadId,
      }));

    if (notifData.length > 0) {
      await tx.notification.createMany({ data: notifData, skipDuplicates: true });
    }

    return msg;
  });

  return message;
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new NotFoundError('Message');
  if (message.senderId !== userId) throw new ForbiddenError('Cannot delete others\' messages');

  return prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), text: null },
  });
}

export async function markThreadRead(threadId: string, userId: string) {
  return prisma.threadParticipant.update({
    where: { threadId_userId: { threadId, userId } },
    data: { lastReadAt: new Date() },
  });
}
