import { FastifyInstance } from 'fastify';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole('ADMIN'));

  // Dashboard
  app.get('/stats', adminController.getDashboardStats);

  // User management
  app.get('/users', adminController.getUsers);
  app.get('/users/:userId', adminController.getUserDetail);
  app.post('/users/:userId/suspend', adminController.suspendUser);
  app.post('/users/:userId/unsuspend', adminController.unsuspendUser);
  app.delete('/users/:userId', adminController.deleteUser);
  app.post('/users/:userId/verify', adminController.verifyUser);

  // Content moderation
  app.get('/reports', adminController.getReports);
  app.post('/reports/:reportId/resolve', adminController.resolveReport);
  app.delete('/posts/:postId', adminController.deletePost);

  // Moderation actions log
  app.get('/moderation-actions', adminController.getModerationActions);

  // Audit logs
  app.get('/audit-logs', adminController.getAuditLogs);
}
