import client from './client';

export interface Promotion {
  id: number;
  title: string;
  description: string;
  type: 'discount' | 'bundle' | 'bogo' | '2+1' | 'box';
  discountValue?: number;
  price?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  quantityRequired?: number;
  quantityFree?: number;
  products: {
    id: number;
    name: string;
    price: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionData {
  title: string;
  description: string;
  type: 'discount' | 'bundle' | 'bogo' | '2+1' | 'box';
  discountValue?: number;
  price?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  productIds: number[];
  quantityRequired?: number;
  quantityFree?: number;
  imageUrl?: string;
}

export interface UpdatePromotionData extends Partial<CreatePromotionData> {
  id: number;
}

export const promotionsApi = {
  // Get all promotions
  getAll: async (): Promise<Promotion[]> => {
    const response = await client.get('/promotions');
    return response.data;
  },

  // Get promotion by ID
  getById: async (id: number): Promise<Promotion> => {
    const response = await client.get(`/promotions/${id}`);
    return response.data;
  },

  // Create new promotion
  create: async (data: CreatePromotionData): Promise<Promotion> => {
    const response = await client.post('/promotions', data);
    return response.data;
  },

  // Update promotion
  update: async (data: UpdatePromotionData): Promise<Promotion> => {
    const response = await client.put(`/promotions/${data.id}`, data);
    return response.data;
  },

  // Delete promotion
  delete: async (id: number): Promise<void> => {
    await client.delete(`/promotions/${id}`);
  },

  // Set new products
  setNewProducts: async (productIds: number[]): Promise<{ message: string }> => {
    const response = await client.post('/promotions/set-new-products', { productIds });
    return response.data;
  },
}; 