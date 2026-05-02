import { FastifyInstance } from 'fastify';
import * as creatorController from '../controllers/creator.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';

export async function creatorRoutes(app: FastifyInstance) {
  // Onboard
  app.post('/onboard', { preHandler: [authenticate] }, creatorController.onboardCreator);

  // Subscriptions (auth required)
  app.get('/subscriptions', { preHandler: [authenticate] }, creatorController.getMySubscriptions);
  app.post('/:creatorId/subscribe', { preHandler: [authenticate] }, creatorController.subscribe);
  app.delete('/:creatorId/subscribe', { preHandler: [authenticate] }, creatorController.unsubscribe);
  app.get('/:creatorId/subscribers', { preHandler: [authenticate] }, creatorController.getSubscribers);

  // Tiers (public read, auth write)
  app.get('/:creatorId/tiers', creatorController.getTiers);
  app.post('/tiers', { preHandler: [authenticate] }, creatorController.createTier);
  app.patch('/tiers/:tierId', { preHandler: [authenticate] }, creatorController.updateTier);
  app.delete('/tiers/:tierId', { preHandler: [authenticate] }, creatorController.deleteTier);

  // Analytics (auth required)
  app.get('/analytics', { preHandler: [authenticate] }, creatorController.getAnalytics);

  // Gated content
  app.get('/:creatorId/content', { preHandler: [optionalAuth] }, creatorController.getGatedContent);
  app.post('/content', { preHandler: [authenticate] }, creatorController.createGatedContent);
}
