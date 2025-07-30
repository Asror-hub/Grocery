import client from './client';

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  priceAtTime: number;
  product: {
    name: string;
    price: number;
  };
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await client.get('/orders');
    return response.data.orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrderById = async (id: number): Promise<Order> => {
  try {
    const response = await client.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
};

export const updateOrderStatus = async (id: number, status: Order['status']): Promise<Order> => {
  try {
    const response = await client.patch(`/orders/${id}/status`, { status });
    return response.data.order;
  } catch (error) {
    console.error(`Error updating order ${id} status:`, error);
    throw error;
  }
}; 