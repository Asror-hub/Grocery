import { apiService, handleApiError } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Data Service for handling all data operations
export const dataService = {
  // Authentication
  auth: {
    async login(email, password) {
      try {
        const response = await apiService.customerAuth.login({ email, password });
        
        const { token, user } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        return { success: true, data: user };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async register(userData) {
      try {
        const response = await apiService.customerAuth.register(userData);
        const { token, user } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        return { success: true, data: user };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async logout() {
      try {
        await apiService.customerAuth.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear local storage
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
      }
    },

    async getCurrentUser() {
      try {
        const userData = await AsyncStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        console.error('Error getting current user:', error);
        return null;
      }
    },

    async isAuthenticated() {
      try {
        const token = await AsyncStorage.getItem('userToken');
        return !!token;
      } catch (error) {
        return false;
      }
    },
  },

  // Products
  products: {
    async getAll(params = {}) {
      try {
        const response = await apiService.products.getAll(params);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async getById(id) {
      try {
        const response = await apiService.products.getById(id);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async getByCategory(categoryId, params = {}) {
      try {
        const response = await apiService.products.getByCategory(categoryId, params);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async search(query, params = {}) {
      try {
        const response = await apiService.products.search(query, params);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },
  },

  // Categories
  categories: {
    async getAll() {
      try {
        const response = await apiService.categories.getAll();
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async getById(id) {
      try {
        const response = await apiService.categories.getById(id);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },
  },

  // Orders
  orders: {
    async create(orderData) {
      try {
        console.log('Attempting to create order with data:', orderData);
        
        const response = await apiService.orders.create(orderData);
        console.log('Backend response:', response);
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Order creation error:', error);
        return { success: false, error: handleApiError(error) };
      }
    },

    async getAll(params = {}) {
      try {
        const response = await apiService.orders.getAll(params);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async getById(id) {
      try {
        const response = await apiService.orders.getById(id);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async cancel(id) {
      try {
        const response = await apiService.orders.cancel(id);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },
  },

  // Profile
  profile: {
    async get() {
      try {
        const response = await apiService.profile.get();
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async update(profileData) {
      try {
        const response = await apiService.profile.update(profileData);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },
  },

  // Notifications
  notifications: {
    async getAll(params = {}) {
      try {
        const response = await apiService.notifications.getAll(params);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async markAsRead(id) {
      try {
        const response = await apiService.notifications.markAsRead(id);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },
  },

  // Promotions
  promotions: {
    async getAll(params = {}) {
      try {
        const response = await apiService.promotions.getAll(params);
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },
  },

  // Settings
  settings: {
    async getStoreContact() {
      try {
        const response = await apiService.settings.getStoreContact();
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async getShopHours() {
      try {
        const response = await apiService.settings.getShopHours();
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },

    async getShopStatus() {
      try {
        const response = await apiService.settings.getShopStatus();
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: handleApiError(error) };
      }
    },
  },

  // Addresses (mock for now)
  addresses: {
    async getAll() {
      // Simulate API call delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            data: [
              {
                id: '1',
                name: 'Home',
                fullName: 'John Doe',
                street: 'Main Street',
                houseNumber: '123',
                district: 'Central',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                phone: '+1 (555) 123-4567',
                isDefault: true,
              },
              {
                id: '2',
                name: 'Office',
                fullName: 'John Doe',
                street: 'Business Avenue',
                houseNumber: '456',
                district: 'Downtown',
                city: 'New York',
                state: 'NY',
                zipCode: '10002',
                phone: '+1 (555) 123-4567',
                isDefault: false,
              },
              {
                id: '3',
                name: 'Summer House',
                fullName: 'John Doe',
                street: 'Beach Road',
                houseNumber: '789',
                district: 'Coastal',
                city: 'Miami',
                state: 'FL',
                zipCode: '33101',
                phone: '+1 (555) 123-4567',
                isDefault: false,
              },
              {
                id: '4',
                name: 'Parents House',
                fullName: 'John Doe',
                street: 'Oak Street',
                houseNumber: '321',
                district: 'Suburban',
                city: 'Chicago',
                state: 'IL',
                zipCode: '60601',
                phone: '+1 (555) 123-4567',
                isDefault: false,
              },
            ]
          });
        }, 500);
      });
    },
  },
};

export default dataService; 

// Utility: Merge promotional offers into products
export async function mergeDiscountPromotions(products) {
  console.log('mergeDiscountPromotions called with', products.length, 'products');
  
  // Fetch all active promotions
  const promotionsResult = await dataService.promotions.getAll({ isActive: true });
  if (!promotionsResult.success) {
    console.log('Failed to fetch promotions, returning original products');
    return products;
  }
  
  const promotions = promotionsResult.data || [];
  console.log('Found', promotions.length, 'promotions');
  
  // Filter for discount and 2+1 promotions
  const promotionalOffers = promotions.filter(p => p.type === 'discount' || p.type === '2+1');
  console.log('Found', promotionalOffers.length, 'discount/2+1 promotions');
  
  // Map productId to promotion
  const productPromotionMap = {};
  promotionalOffers.forEach(promo => {
    if (promo.products && Array.isArray(promo.products)) {
      promo.products.forEach(prod => {
        productPromotionMap[prod.id] = promo;
        console.log('Mapped product', prod.id, 'to promotion', promo.id, 'type:', promo.type);
      });
    }
  });
  
  console.log('Product promotion map:', Object.keys(productPromotionMap));
  
  // Merge promotion into products
  const result = products.map(product => {
    const promo = productPromotionMap[product.id];
    if (promo) {
      console.log('Adding promotion to product', product.id, 'type:', promo.type);
      return {
        ...product,
        promotion: {
          id: promo.id,
          title: promo.title,
          type: promo.type,
          discountValue: promo.discountValue,
          price: promo.price,
          quantityRequired: promo.quantityRequired,
          quantityFree: promo.quantityFree
        }
      };
    }
    return product;
  });
  
  const productsWithPromotions = result.filter(p => p.promotion);
  console.log('Final result:', productsWithPromotions.length, 'products with promotions');
  
  return result;
} 