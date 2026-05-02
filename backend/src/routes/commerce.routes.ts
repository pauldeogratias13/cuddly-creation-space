import { FastifyInstance } from 'fastify';
import * as commerceController from '../controllers/commerce.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export async function commerceRoutes(app: FastifyInstance) {
  // Products — public read, auth write
  app.get('/products', commerceController.getProducts);
  app.get('/products/:productId', commerceController.getProduct);
  app.post('/products', { preHandler: [authenticate] }, commerceController.createProduct);
  app.patch('/products/:productId', { preHandler: [authenticate] }, commerceController.updateProduct);
  app.delete('/products/:productId', { preHandler: [authenticate] }, commerceController.deleteProduct);

  // Cart
  app.get('/cart', { preHandler: [authenticate] }, commerceController.getCart);
  app.post('/cart', { preHandler: [authenticate] }, commerceController.addToCart);
  app.delete('/cart', { preHandler: [authenticate] }, commerceController.clearCart);
  app.delete('/cart/:productId', { preHandler: [authenticate] }, commerceController.removeFromCart);

  // Orders
  app.get('/orders', { preHandler: [authenticate] }, commerceController.getOrders);
  app.get('/orders/:orderId', { preHandler: [authenticate] }, commerceController.getOrder);
  app.post('/orders', { preHandler: [authenticate] }, commerceController.createOrder);
  app.post('/orders/:orderId/cancel', { preHandler: [authenticate] }, commerceController.cancelOrder);

  // Payments
  app.post('/payments/checkout', { preHandler: [authenticate] }, commerceController.createCheckout);
  app.post('/payments/webhook', commerceController.stripeWebhook);

  // Tips
  app.post('/tips', { preHandler: [authenticate] }, commerceController.sendTip);

  // Earnings
  app.get('/earnings', { preHandler: [authenticate] }, commerceController.getEarnings);
}
