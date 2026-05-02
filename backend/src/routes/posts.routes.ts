import { FastifyInstance } from 'fastify';
import * as postsController from '../controllers/posts.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js';

export async function postRoutes(app: FastifyInstance) {
  // Public / optional auth
  app.get('/feed', { preHandler: [optionalAuth] }, postsController.getFeed);
  app.get('/trending', { preHandler: [optionalAuth] }, postsController.getTrending);
  app.get('/:postId', { preHandler: [optionalAuth] }, postsController.getPost);
  app.get('/:postId/comments', { preHandler: [optionalAuth] }, postsController.getComments);

  // Authenticated
  app.post('/', { preHandler: [authenticate] }, postsController.createPost);
  app.patch('/:postId', { preHandler: [authenticate] }, postsController.updatePost);
  app.delete('/:postId', { preHandler: [authenticate] }, postsController.deletePost);

  app.post('/:postId/like', { preHandler: [authenticate] }, postsController.likePost);
  app.delete('/:postId/like', { preHandler: [authenticate] }, postsController.unlikePost);

  app.post('/:postId/bookmark', { preHandler: [authenticate] }, postsController.bookmarkPost);
  app.delete('/:postId/bookmark', { preHandler: [authenticate] }, postsController.unbookmarkPost);

  app.post('/:postId/repost', { preHandler: [authenticate] }, postsController.repost);

  app.post('/:postId/comments', { preHandler: [authenticate] }, postsController.addComment);
  app.delete('/comments/:commentId', { preHandler: [authenticate] }, postsController.deleteComment);

  app.get('/me/bookmarks', { preHandler: [authenticate] }, postsController.getBookmarks);
  app.get('/user/:userId', { preHandler: [optionalAuth] }, postsController.getUserPosts);
}
