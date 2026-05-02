import { FastifyInstance } from 'fastify';
import { prisma } from '../config/prisma.js';

// In-memory map: userId -> Set of WebSocket connections
const connections = new Map<string, Set<any>>();

export function registerWebSocketHandlers(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, async (socket, request) => {
    let userId: string | null = null;

    socket.on('message', async (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString());

        // ── Authenticate ──────────────────────────────────────────────
        if (msg.type === 'auth') {
          try {
            const payload = (app as any).jwt.verify(msg.token) as { sub: string };
            userId = payload.sub;

            if (!connections.has(userId)) connections.set(userId, new Set());
            connections.get(userId)!.add(socket);

            socket.send(JSON.stringify({ type: 'auth_ok', userId }));
          } catch {
            socket.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
          }
          return;
        }

        if (!userId) {
          socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
          return;
        }

        // ── Typing indicator ──────────────────────────────────────────
        if (msg.type === 'typing') {
          const { threadId, isTyping } = msg;

          // Notify other participants in the thread
          const participants = await prisma.threadParticipant.findMany({
            where: { threadId, userId: { not: userId } },
            select: { userId: true },
          });

          for (const p of participants) {
            broadcast(p.userId, { type: 'typing', from: userId, threadId, isTyping });
          }
        }

        // ── Message delivered confirmation ────────────────────────────
        if (msg.type === 'message_delivered') {
          const { messageId } = msg;
          if (messageId) {
            await prisma.message.updateMany({
              where: { id: messageId, status: 'SENT' },
              data: { status: 'DELIVERED' },
            });
          }
        }

        // ── Ping / pong ───────────────────────────────────────────────
        if (msg.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    socket.on('close', () => {
      if (userId) {
        connections.get(userId)?.delete(socket);
        if (connections.get(userId)?.size === 0) connections.delete(userId);
      }
    });

    socket.on('error', (err: Error) => {
      app.log.error({ err }, 'WebSocket error');
    });
  });
}

/** Send a JSON payload to all open sockets for a given userId */
export function broadcast(userId: string, payload: object) {
  const sockets = connections.get(userId);
  if (!sockets) return;

  const data = JSON.stringify(payload);
  for (const socket of sockets) {
    try {
      if (socket.readyState === 1 /* OPEN */) {
        socket.send(data);
      }
    } catch {
      sockets.delete(socket);
    }
  }
}

/** Broadcast to all currently connected users */
export function broadcastAll(payload: object) {
  for (const userId of connections.keys()) {
    broadcast(userId, payload);
  }
}

/** Get count of online users */
export function getOnlineCount(): number {
  return connections.size;
}
