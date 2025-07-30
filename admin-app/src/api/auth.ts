import client from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'admin';
  };
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    client.post<AuthResponse>('/auth/login', credentials),
  getCurrentUser: () => client.get<AuthResponse['user']>('/auth/me'),
}; 