export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  imageUrl: string | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
}

export interface OrderItem {
  id: number;
  productId?: number;
  quantity: number;
  price: number;
  itemType: 'product' | 'box';
  boxId?: number;
  boxTitle?: string;
  boxDescription?: string;
  boxProducts?: any[];
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
  };
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryAddress: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  orderItems?: OrderItem[];
} 