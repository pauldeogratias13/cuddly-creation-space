import { FastifyRequest, FastifyReply } from 'fastify';
import * as commerceService from '../services/commerce.service.js';
import { prisma } from '../config/prisma.js';
import { success, paginated } from '../utils/response.js';
import { PaginationSchema, CreateProductSchema, AddToCartSchema, CreateOrderSchema } from '../utils/validators.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const { category, minPrice, maxPrice, sellerId, q } = request.query as any;

  const { products, total } = await commerceService.listProducts({
    page,
    limit,
    category,
    sellerId,
    q,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
  });

  return reply.send(paginated(products, total, page, limit));
}

export async function getProduct(
  request: FastifyRequest<{ Params: { productId: string } }>,
  reply: FastifyReply
) {
  const product = await commerceService.getProductById(request.params.productId);
  return reply.send(success(product));
}

export async function createProduct(request: FastifyRequest, reply: FastifyReply) {
  const body = CreateProductSchema.parse(request.body);
  const product = await commerceService.createProduct(request.userId, body);
  return reply.status(201).send(success(product, 'Product created'));
}

export async function updateProduct(
  request: FastifyRequest<{ Params: { productId: string } }>,
  reply: FastifyReply
) {
  const { productId } = request.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product');
  if (product.sellerId !== request.userId && request.userRole !== 'ADMIN') throw new ForbiddenError();

  const updated = await prisma.product.update({
    where: { id: productId },
    data: request.body as any,
  });
  return reply.send(success(updated, 'Product updated'));
}

export async function deleteProduct(
  request: FastifyRequest<{ Params: { productId: string } }>,
  reply: FastifyReply
) {
  const { productId } = request.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product');
  if (product.sellerId !== request.userId && request.userRole !== 'ADMIN') throw new ForbiddenError();

  await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
  return reply.send(success(null, 'Product removed'));
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCart(request: FastifyRequest, reply: FastifyReply) {
  const items = await commerceService.getCart(request.userId);
  return reply.send(success(items));
}

export async function addToCart(request: FastifyRequest, reply: FastifyReply) {
  const { productId, quantity } = AddToCartSchema.parse(request.body);
  const item = await commerceService.addToCart(request.userId, productId, quantity);
  return reply.status(201).send(success(item, 'Added to cart'));
}

export async function removeFromCart(
  request: FastifyRequest<{ Params: { productId: string } }>,
  reply: FastifyReply
) {
  await commerceService.removeFromCart(request.userId, request.params.productId);
  return reply.send(success(null, 'Removed from cart'));
}

export async function clearCart(request: FastifyRequest, reply: FastifyReply) {
  await commerceService.clearCart(request.userId);
  return reply.send(success(null, 'Cart cleared'));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId: request.userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    }),
    prisma.order.count({ where: { userId: request.userId } }),
  ]);

  return reply.send(paginated(orders, total, page, limit));
}

export async function getOrder(
  request: FastifyRequest<{ Params: { orderId: string } }>,
  reply: FastifyReply
) {
  const { orderId } = request.params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: { include: { profile: true } },
    },
  });
  if (!order) throw new NotFoundError('Order');
  if (order.userId !== request.userId && request.userRole !== 'ADMIN') throw new ForbiddenError();
  return reply.send(success(order));
}

export async function createOrder(request: FastifyRequest, reply: FastifyReply) {
  const { productIds, shippingAddress, notes } = CreateOrderSchema.parse(request.body);
  const order = await commerceService.createOrder(request.userId, productIds, shippingAddress, notes);
  return reply.status(201).send(success(order, 'Order created'));
}

export async function cancelOrder(
  request: FastifyRequest<{ Params: { orderId: string } }>,
  reply: FastifyReply
) {
  const { orderId } = request.params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order');
  if (order.userId !== request.userId) throw new ForbiddenError();
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new Error('Cannot cancel order in this state');
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  return reply.send(success(null, 'Order cancelled'));
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createCheckout(request: FastifyRequest, reply: FastifyReply) {
  const { orderId, successUrl, cancelUrl } = request.body as any;
  const session = await commerceService.createCheckoutSession(
    orderId,
    request.userId,
    successUrl,
    cancelUrl
  );
  return reply.send(success(session));
}

export async function stripeWebhook(request: FastifyRequest, reply: FastifyReply) {
  const signature = request.headers['stripe-signature'] as string;
  const result = await commerceService.handleStripeWebhook(
    (request as any).rawBody ?? Buffer.from(JSON.stringify(request.body)),
    signature
  );
  return reply.send(result);
}

// ─── Tips ─────────────────────────────────────────────────────────────────────

export async function sendTip(request: FastifyRequest, reply: FastifyReply) {
  const { toUserId, amount, currency, message, isAnonymous } = request.body as any;

  const tip = await prisma.tip.create({
    data: {
      fromUserId: request.userId,
      toUserId,
      amount,
      currency: currency ?? 'USD',
      message,
      isAnonymous: isAnonymous ?? false,
    },
  });

  // Notify recipient
  if (!isAnonymous) {
    await prisma.notification.create({
      data: {
        userId: toUserId,
        type: 'TIP',
        title: 'You received a tip!',
        body: message ?? `Someone sent you $${amount}`,
        actorId: request.userId,
        resourceId: tip.id,
      },
    });
  }

  return reply.status(201).send(success(tip, 'Tip sent'));
}

export async function getEarnings(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { page, limit } = PaginationSchema.parse(request.query);
  const skip = (page - 1) * limit;

  const [earnings, total] = await prisma.$transaction([
    prisma.creatorEarning.findMany({
      where: { creatorId: request.userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.creatorEarning.count({ where: { creatorId: request.userId } }),
  ]);

  const aggregate = await prisma.creatorEarning.aggregate({
    where: { creatorId: request.userId },
    _sum: { amount: true },
  });

  return reply.send(
    paginated(
      earnings as any,
      total,
      page,
      limit
    )
  );
}
