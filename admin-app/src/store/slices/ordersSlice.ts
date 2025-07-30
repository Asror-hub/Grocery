import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import client from '../../api/client';
import { io, Socket } from 'socket.io-client';
import { RootState } from '../index';
import { store } from '../index';
import { Order, OrderItem } from '../../types';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';



interface OrdersResponse {
  orders: Order[];
  total: number;
  currentPage: number;
  totalPages: number;
}

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
};

// Socket.IO connection
let socket: Socket | null = null;
let notificationAudio: HTMLAudioElement | null = null;
let notificationInterval: NodeJS.Timeout | null = null;
let pendingOrderIds: Set<number> = new Set();

// Initialize notification audio
const initializeNotificationAudio = () => {
  try {
    notificationAudio = new Audio('/notification.mp3');
    notificationAudio.preload = 'auto';
    notificationAudio.volume = 0.7;
    notificationAudio.loop = false; // We'll handle looping manually
    
    // Try to load the audio
    notificationAudio.load();
    console.log('🔊 Notification audio initialized');
  } catch (error) {
    console.error('Failed to initialize notification audio:', error);
  }
};

// Play repeating notification sound
const playRepeatingNotification = (orderId: number) => {
  try {
    if (notificationAudio) {
      // Add order to pending list
      pendingOrderIds.add(orderId);
      
      // Reset audio to beginning
      notificationAudio.currentTime = 0;
      
      // Play the sound
      const playPromise = notificationAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('🔊 Repeating notification started for order:', orderId);
          
          // Set up repeating interval (play every 3 seconds)
          notificationInterval = setInterval(() => {
            if (pendingOrderIds.has(orderId)) {
              notificationAudio!.currentTime = 0;
              notificationAudio!.play().catch(console.error);
              console.log('🔊 Repeating notification for order:', orderId);
            }
          }, 3000); // Repeat every 3 seconds
          
        }).catch(error => {
          console.error('🔊 Failed to start repeating notification:', error);
        });
      }
    } else {
      console.warn('🔊 Notification audio not initialized');
    }
  } catch (error) {
    console.error('🔊 Failed to play repeating notification:', error);
  }
};

// Stop notification sound for specific order
const stopNotificationForOrder = (orderId: number) => {
  try {
    // Remove order from pending list
    pendingOrderIds.delete(orderId);
    
    // If no more pending orders, stop the interval
    if (pendingOrderIds.size === 0 && notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
      
      // Stop the audio
      if (notificationAudio) {
        notificationAudio.pause();
        notificationAudio.currentTime = 0;
      }
      
      console.log('🔊 All notifications stopped');
    } else {
      console.log('🔊 Notification stopped for order:', orderId);
    }
  } catch (error) {
    console.error('🔊 Failed to stop notification:', error);
  }
};

// Stop all notifications
const stopAllNotifications = () => {
  try {
    pendingOrderIds.clear();
    
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
    
    if (notificationAudio) {
      notificationAudio.pause();
      notificationAudio.currentTime = 0;
    }
    
    console.log('🔊 All notifications stopped');
  } catch (error) {
    console.error('🔊 Failed to stop all notifications:', error);
  }
};

const connectSocket = () => {
  if (socket?.connected) return;

  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found, skipping Socket.IO connection');
    return;
  }

  // Initialize notification audio
  initializeNotificationAudio();

  socket = io(SOCKET_URL, {
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected');
  });

  socket.on('new_order', (data) => {
    console.log('🔔 New order received via Socket.IO:', data);
    console.log('🔔 Order details:', data.order);
    
    // Play notification sound
    playRepeatingNotification(data.order.id);
    
    // Add new order to state
    store.dispatch(addOrder(data.order));
    console.log('✅ New order added to state');
    
    // Dispatch a custom event to trigger visual notification
    window.dispatchEvent(new CustomEvent('newOrderReceived'));
  });

  socket.on('orderStatusUpdated', (data) => {
    console.log('🔄 Order status updated via Socket.IO:', data);
    console.log('🔄 Updated order details:', data.order);
    console.log('🔄 Order status:', data.order?.status);
    console.log('🔄 Pending order IDs:', Array.from(pendingOrderIds));
    
    // Stop notification immediately when order is accepted (processing) or any non-pending status
    if (data.order && data.order.status !== 'pending') {
      console.log('🔊 Attempting to stop notification for order:', data.order.id);
      stopNotificationForOrder(data.order.id);
      console.log('🔊 Notification stopped immediately - order status:', data.order.status);
    } else {
      console.log('🔊 Not stopping notification - order still pending or no order data');
    }
    
    // Update order in state if we have the complete order data
    if (data.order) {
      store.dispatch(updateOrder(data.order));
      console.log('✅ Order updated in state');
    }
  });

  socket.on('order_deleted', (data) => {
    console.log('🗑️ Order deleted via Socket.IO:', data);
    // Remove the deleted order from state
    store.dispatch(removeOrder(data.orderId));
    console.log('✅ Order removed from state');
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
};

// Export function to connect Socket.IO after login
export const initializeSocketConnection = () => {
  connectSocket();
};

// Export function to disconnect Socket.IO on logout
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket.IO disconnected');
  }
};

// Don't connect automatically - wait for login

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async () => {
    const response = await client.get('/orders/admin');
    return response.data;
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status }: { orderId: number; status: string }) => {
    console.log('🔄 Redux: Updating order status:', { orderId, status });
    console.log('🔍 Redux: Client baseURL:', client.defaults.baseURL);
    console.log('🔍 Redux: Full URL will be:', `${client.defaults.baseURL}/orders/${orderId}/status`);
    
    try {
      const response = await client.patch(`/orders/${orderId}/status`, { status });
      console.log('✅ Redux: Order status update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Redux: Order status update error:', error);
      console.error('❌ Redux: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: client.defaults.baseURL
      });
      throw error;
    }
  }
);

export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async (orderId: number) => {
    const response = await client.delete(`/orders/${orderId}`);
    return response.data;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    removeOrder: (state, action: PayloadAction<number>) => {
      state.orders = state.orders.filter(order => order.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order.id === action.payload.order.id);
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter(order => order.id !== action.meta.arg);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete order';
      });
  },
});

export const { addOrder, updateOrder, removeOrder } = ordersSlice.actions;
export default ordersSlice.reducer;

export const selectOrders = (state: RootState) => state.orders.orders;
export const selectOrdersLoading = (state: RootState) => state.orders.loading;
export const selectOrdersError = (state: RootState) => state.orders.error; 