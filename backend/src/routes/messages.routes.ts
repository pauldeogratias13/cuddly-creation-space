import { FastifyInstance } from 'fastify';
import * as messagesController from '../controllers/messages.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export async function messageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // Threads (conversations)
  app.get('/threads', messagesController.getThreads);
  app.post('/threads', messagesController.createThread);
  app.get('/threads/:threadId', messagesController.getThread);
  app.delete('/threads/:threadId', messagesController.leaveThread);

  // Messages within a thread
  app.get('/threads/:threadId/messages', messagesController.getMessages);
  app.post('/threads/:threadId/messages', messagesController.sendMessage);
  app.post('/threads/:threadId/read', messagesController.markAsRead);

  // Individual message
  app.delete('/:messageId', messagesController.deleteMessage);
}
