import { FastifyInstance } from 'fastify';
import * as notificationsController from '../controllers/notifications.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', notificationsController.getNotifications);
  app.post('/read-all', notificationsController.markAllRead);
  app.post('/:notificationId/read', notificationsController.markRead);
  app.delete('/:notificationId', notificationsController.deleteNotification);
  app.get('/unread-count', notificationsController.getUnreadCount);
}
