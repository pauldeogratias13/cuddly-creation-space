import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', authController.register);
  app.post('/login', authController.login);
  app.post('/refresh', authController.refresh);
  app.post('/logout', { preHandler: [authenticate] }, authController.logout);
  app.get('/verify-email', authController.verifyEmail);
  app.post('/forgot-password', authController.forgotPassword);
  app.post('/reset-password', authController.resetPassword);
  app.get('/me', { preHandler: [authenticate] }, authController.me);
}
