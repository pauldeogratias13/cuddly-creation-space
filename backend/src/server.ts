import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { resolve } from 'path';

// Routes
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/users.routes.js';
import { postRoutes } from './routes/posts.routes.js';
import { messageRoutes } from './routes/messages.routes.js';
import { notificationRoutes } from './routes/notifications.routes.js';
import { commerceRoutes } from './routes/commerce.routes.js';
import { creatorRoutes } from './routes/creator.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { searchRoutes } from './routes/search.routes.js';
import { mediaRoutes } from './routes/media.routes.js';

// WebSocket handler
import { registerWebSocketHandlers } from './websocket/ws.handler.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.NODE_ENV === 'development' ? {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      } : {}),
    },
    trustProxy: true,
  });

  // ── Security ────────────────────────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await app.register(fastifyCors, {
    origin: config.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyRateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please slow down.' },
    }),
  });

  // ── Auth ────────────────────────────────────────────────────────────────────
  await app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: '15m' },
  });

  // ── File uploads ────────────────────────────────────────────────────────────
  await app.register(fastifyMultipart, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  });

  // ── Serve local uploads (dev only) ──────────────────────────────────────────
  await app.register(fastifyStatic, {
    root: resolve('./uploads'),
    prefix: '/uploads/',
  });

  // ── WebSockets ──────────────────────────────────────────────────────────────
  await app.register(fastifyWebsocket);

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV,
    version: process.env.npm_package_version ?? '1.0.0',
  }));

  // ── API Routes ───────────────────────────────────────────────────────────────
  const API = '/api/v1';

  await app.register(authRoutes, { prefix: `${API}/auth` });
  await app.register(userRoutes, { prefix: `${API}/users` });
  await app.register(postRoutes, { prefix: `${API}/posts` });
  await app.register(messageRoutes, { prefix: `${API}/messages` });
  await app.register(notificationRoutes, { prefix: `${API}/notifications` });
  await app.register(commerceRoutes, { prefix: `${API}/commerce` });
  await app.register(creatorRoutes, { prefix: `${API}/creators` });
  await app.register(adminRoutes, { prefix: `${API}/admin` });
  await app.register(searchRoutes, { prefix: `${API}/search` });
  await app.register(mediaRoutes, { prefix: `${API}/media` });

  // ── WebSocket handlers ───────────────────────────────────────────────────────
  registerWebSocketHandlers(app);

  // ── Global error handler ─────────────────────────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    const statusCode = (error as any).statusCode ?? 500;
    const code = (error as any).code ?? 'INTERNAL_ERROR';

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled error');
    }

    // Zod errors
    if (error.name === 'ZodError') {
      return reply.status(422).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: (error as any).issues },
      });
    }

    // Prisma unique constraint
    if ((error as any).code === 'P2002') {
      return reply.status(409).send({
        success: false,
        error: { code: 'CONFLICT', message: 'Resource already exists' },
      });
    }

    // Prisma record not found
    if ((error as any).code === 'P2025') {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    }

    return reply.status(statusCode).send({
      success: false,
      error: {
        code,
        message: statusCode < 500 ? error.message : 'Internal server error',
        ...(config.NODE_ENV === 'development' && statusCode >= 500 ? { stack: error.stack } : {}),
      },
    });
  });

  // ── 404 ──────────────────────────────────────────────────────────────────────
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
    });
  });

  return app;
}

// ── Main entry ───────────────────────────────────────────────────────────────

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info(`🚀 NEXUS Backend running on http://0.0.0.0:${config.PORT}`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
