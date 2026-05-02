/**
 * Commerce domain types — maps to Product / Order / OrderItem / CartItem in Prisma
 */

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string | null;
  price: number; // Decimal → number after serialisation
  currency: string;
  stock: number;
  imageUrls: string[];
  category: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  product?: Product;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  stripePaymentIntentId: string | null;
  shippingAddress: ShippingAddress | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  createdAt: Date;
  product?: Product;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  stock?: number;
  imageUrls?: string[];
  category?: string;
  tags?: string[];
}

export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress?: ShippingAddress;
  notes?: string;
}
