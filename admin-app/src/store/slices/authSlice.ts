import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../api/client';
import { authApi, LoginCredentials } from '../../api/auth';
import { initializeSocketConnection, disconnectSocket } from './ordersSlice';

interface AuthState {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: string;
  } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface RegisterCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

console.log('🔍 Auth: Initial state created', { 
  token: !!localStorage.getItem('token'),
  tokenValue: localStorage.getItem('token')?.substring(0, 20) + '...'
});

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('🔍 Frontend: Attempting login with:', { email: credentials.email });
      console.log('🔍 Frontend: Making request to /admin/auth/login');
      
      const response = await client.post('/admin/auth/login', credentials);
      
      console.log('🔍 Frontend: Response received:', response);
      console.log('🔍 Frontend: Response status:', response.status);
      console.log('🔍 Frontend: Response data:', response.data);
      
      const { token, admin } = response.data;
      console.log('🔍 Frontend: Extracted token:', !!token);
      console.log('🔍 Frontend: Extracted admin:', admin);
      
      localStorage.setItem('token', token);
      console.log('🔍 Frontend: Token saved to localStorage');
      
      // Initialize Socket.IO connection after successful login
      initializeSocketConnection();
      console.log('🔍 Frontend: Socket.IO connection initialized');
      
      return { token, user: admin };
    } catch (error: any) {
      console.error('❌ Frontend: Login error:', error);
      console.error('❌ Frontend: Error response:', error.response);
      console.error('❌ Frontend: Error status:', error.response?.status);
      console.error('❌ Frontend: Error data:', error.response?.data);
      
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Login failed. Please check your credentials and try again.'
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials) => {
    const response = await client.post('/admin/auth/register', credentials);
    return response.data;
  }
);

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async () => {
  const response = await authApi.getCurrentUser();
  return response.data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      // Disconnect Socket.IO on logout
      disconnectSocket();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        console.log('🔍 Auth: Login pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('🔍 Auth: Login fulfilled', { 
          token: !!action.payload.token, 
          user: !!action.payload.user 
        });
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        console.log('🔍 Auth: State updated', { 
          token: !!state.token, 
          user: !!state.user 
        });
      })
      .addCase(login.rejected, (state, action) => {
        console.log('🔍 Auth: Login rejected', action.error.message);
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 