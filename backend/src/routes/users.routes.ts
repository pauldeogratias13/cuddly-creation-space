import { FastifyInstance } from 'fastify';
import * as usersController from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export async function userRoutes(app: FastifyInstance) {
  // Public
  app.get('/:userId', usersController.getUser);
  app.get('/:userId/posts', usersController.getUserPosts);
  app.get('/:userId/followers', usersController.getFollowers);
  app.get('/:userId/following', usersController.getFollowing);

  // Authenticated
  app.patch('/me', { preHandler: [authenticate] }, usersController.updateProfile);
  app.post('/:userId/follow', { preHandler: [authenticate] }, usersController.followUser);
  app.delete('/:userId/follow', { preHandler: [authenticate] }, usersController.unfollowUser);
  app.get('/me/suggestions', { preHandler: [authenticate] }, usersController.getSuggestions);
  app.put('/me/avatar', { preHandler: [authenticate] }, usersController.updateAvatar);
  app.put('/me/banner', { preHandler: [authenticate] }, usersController.updateBanner);
  app.delete('/me', { preHandler: [authenticate] }, usersController.deleteAccount);
  app.post('/:userId/block', { preHandler: [authenticate] }, usersController.blockUser);
  app.delete('/:userId/block', { preHandler: [authenticate] }, usersController.unblockUser);
  app.post('/:userId/mute', { preHandler: [authenticate] }, usersController.muteUser);
  app.delete('/:userId/mute', { preHandler: [authenticate] }, usersController.unmuteUser);
}
