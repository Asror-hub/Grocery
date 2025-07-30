import client from './client';

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  admin: Admin;
}

export interface ApiError {
  error: string;
  details?: string[];
}

export const adminAuthApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await client.post<AuthResponse>('admin/auth/register', data);
      return response.data;
    } catch (error: any) {
      console.log('Registration API error:', error.response?.data);
      if (error.response?.data?.error === 'Email already registered') {
        throw new Error('This email is already registered. Please use a different email or try logging in.');
      }
      throw new Error('Registration failed. Please check your information and try again.');
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await client.post<AuthResponse>('admin/auth/login', data);
      return response.data;
    } catch (error: any) {
      console.log('Login API error:', error.response?.data);
      if (error.response?.data?.error === 'Invalid credentials') {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw new Error('Login failed. Please try again later.');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await client.post('admin/auth/logout');
    } catch (error: any) {
      console.log('Logout API error:', error.response?.data);
      throw new Error('Logout failed. Please try again.');
    }
  }
}; 