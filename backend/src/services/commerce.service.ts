import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import Stripe from 'stripe';
import { config } from '../config/env.js';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// ─── Products ─────────────────────────────────────────────────────────────────

export async function listProducts(params: {
  page: number;
  limit: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  q?: string;
}) {
  const { page, limit, category, minPrice, maxPrice, sellerId, q } = params;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };
  if (category) where.category = category;
  if (sellerId) where.sellerId = sellerId;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) throw new NotFoundError('Product');
  return product;
}

export async function createProduct(
  sellerId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    stock?: number;
    imageUrls?: string[];
    category?: string;
    tags?: string[];
  }
) {
  return prisma.product.create({
    data: {
      sellerId,
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency ?? 'USD',
      stock: data.stock ?? 0,
      imageUrls: data.imageUrls ?? [],
      category: data.category,
      tags: data.tags ?? [],
    },
  });
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCart(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) throw new NotFoundError('Product');

  return prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, quantity },
    update: { quantity },
    include: { product: true },
  });
}

export async function removeFromCart(userId: string, productId: string) {
  return prisma.cartItem.deleteMany({ where: { userId, productId } });
}

export async function clearCart(userId: string) {
  return prisma.cartItem.deleteMany({ where: { userId } });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(
  userId: string,
  items: Array<{ productId: string; quantity: number }>,
  shippingAddress?: object,
  notes?: string
) {
  return prisma.$transaction(async (tx) => {
    let totalAmount = 0;

    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await tx.product.findUnique({
          where: { id: item.productId, isActive: true },
        });
        if (!product) throw new NotFoundError(`Product ${item.productId}`);
        if (product.stock > 0 && product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        totalAmount += Number(product.price) * item.quantity;
        return { ...item, product };
      })
    );

    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        currency: enrichedItems[0]?.product.currency ?? 'USD',
        status: 'PENDING',
        shippingAddress: shippingAddress ?? null,
        notes: notes ?? null,
        items: {
          create: enrichedItems.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    return order;
  });
}

// ─── Stripe checkout ──────────────────────────────────────────────────────────

export async function createCheckoutSession(
  orderId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new NotFoundError('Order');
  if (order.userId !== userId) throw new Error('Forbidden');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: order.items.map((item) => ({
      price_data: {
        currency: order.currency.toLowerCase(),
        product_data: { name: item.productName },
        unit_amount: Math.round(Number(item.unitPrice) * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orderId, userId },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { stripePaymentIntentId: session.payment_intent as string },
  });

  return { sessionId: session.id, url: session.url };
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return { received: true };

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });
  }

  return { received: true };
}
