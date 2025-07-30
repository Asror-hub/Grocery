import client from './client';

export interface ShopSettings {
  openingTime: string;
  closingTime: string;
  isOpen24_7?: boolean;
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
  currency?: string;
  taxRate?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  orderUpdates?: boolean;
  marketingEmails?: boolean;
}

function mapFromBackend(settings: any): ShopSettings {
  return {
    ...settings,
    openingTime: settings.opening_time || settings.openingTime || '07:00',
    closingTime: settings.closing_time || settings.closingTime || '22:00',
    isOpen24_7: settings.is_open_24_7 === 'true' || settings.isOpen24_7 === true,
  };
}

function mapToBackend(settings: ShopSettings): any {
  return {
    ...settings,
    opening_time: settings.openingTime,
    closing_time: settings.closingTime,
    is_open_24_7: settings.isOpen24_7 ? 'true' : 'false',
  };
}

export const getSettings = async (): Promise<ShopSettings> => {
  try {
    const response = await client.get('/settings/admin');
    return mapFromBackend(response.data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

export const updateSettings = async (settings: Partial<ShopSettings>): Promise<void> => {
  try {
    const response = await client.put('/settings/admin', { settings: mapToBackend(settings as ShopSettings) });
    return response.data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

export const getShopHours = async (): Promise<{ openingTime: string; closingTime: string }> => {
  try {
    const response = await client.get('/settings/shop-hours');
    return mapFromBackend(response.data);
  } catch (error) {
    console.error('Error fetching shop hours:', error);
    // Return default values if API fails
    return {
      openingTime: '07:00',
      closingTime: '22:00'
    };
  }
};

export const checkShopStatus = async (): Promise<{
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  currentTime: string;
}> => {
  try {
    const response = await client.get('/settings/shop-status');
    // Only map the time fields, keep isOpen and currentTime as is
    return {
      ...response.data,
      openingTime: response.data.opening_time || response.data.openingTime || '07:00',
      closingTime: response.data.closing_time || response.data.closingTime || '22:00',
    };
  } catch (error) {
    console.error('Error checking shop status:', error);
    throw error;
  }
}; 