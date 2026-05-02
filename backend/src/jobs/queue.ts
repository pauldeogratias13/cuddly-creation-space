import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/prisma.js';

const connection = { host: redis.options?.host ?? 'localhost', port: redis.options?.port ?? 6379 };

// ── Queues ────────────────────────────────────────────────────────────────────

export const emailQueue = new Queue('emails', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const mediaQueue = new Queue('media-processing', { connection });
export const analyticsQueue = new Queue('analytics', { connection });

// ── Email worker ──────────────────────────────────────────────────────────────

export const emailWorker = new Worker(
  'emails',
  async (job) => {
    const { to, subject, html } = job.data;
    logger.info({ to, subject, jobId: job.id }, 'Processing email job (stub)');
    // TODO: wire up Nodemailer / Resend
  },
  { connection }
);

// ── Notification push worker ──────────────────────────────────────────────────

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { userId, type, title, body, resourceId } = job.data;

    await prisma.notification.create({
      data: { userId, type, title, body, resourceId },
    });

    logger.info({ userId, type, title }, 'Notification created via queue');
  },
  { connection }
);

// ── Media processing worker ───────────────────────────────────────────────────

export const mediaWorker = new Worker(
  'media-processing',
  async (job) => {
    const { mediaId, action } = job.data;
    logger.info({ mediaId, action }, 'Processing media job (stub)');
    // TODO: resize images with sharp, generate thumbnails
    // For now just log — no 'processed' field in schema
  },
  { connection }
);

// ── Analytics aggregation (daily) ────────────────────────────────────────────

export const analyticsWorker = new Worker(
  'analytics',
  async (job) => {
    if (job.name === 'daily-aggregation') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      const [newUsers, newPosts, newOrders] = await prisma.$transaction([
        prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
        prisma.post.count({ where: { createdAt: { gte: yesterday, lt: today }, deletedAt: null } }),
        prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      ]);

      logger.info(
        { date: yesterday.toISOString().split('T')[0], newUsers, newPosts, newOrders },
        'Daily analytics aggregated'
      );
    }

    if (job.name === 'purge-sessions') {
      const deleted = await prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      logger.info({ count: deleted.count }, 'Expired sessions purged');
    }
  },
  { connection }
);

// ── Scheduled jobs ────────────────────────────────────────────────────────────

export async function scheduleRepeatableJobs() {
  await analyticsQueue.add('daily-aggregation', {}, {
    repeat: { pattern: '0 0 * * *' },
    removeOnComplete: 10,
    removeOnFail: 5,
  });

  await analyticsQueue.add('purge-sessions', {}, {
    repeat: { pattern: '0 * * * *' },
    removeOnComplete: 5,
    removeOnFail: 5,
  });

  logger.info('Repeatable background jobs scheduled');
}

// ── Error / completion handlers ───────────────────────────────────────────────

for (const worker of [emailWorker, notificationWorker, mediaWorker, analyticsWorker]) {
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, err }, 'Job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id, jobName: job.name }, 'Job completed');
  });
}

export function startAllWorkers() {
  logger.info('BullMQ workers started');
  scheduleRepeatableJobs().catch((err) =>
    logger.error(err, 'Failed to schedule repeatable jobs')
  );
}
