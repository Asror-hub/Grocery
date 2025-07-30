import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import client from '../../api/client';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalRevenue: number;
  totalRevenueCash: number;
  totalRevenueCard: number;
  selectedDayOrders: number;
  selectedDayRevenue: number;
  selectedDayRevenueCash: number;
  selectedDayRevenueCard: number;
  selectedDayOrdersChange: number;
  selectedDayRevenueChange: number;
  selectedWeekOrders: number;
  selectedWeekRevenue: number;
  selectedWeekRevenueCash: number;
  selectedWeekRevenueCard: number;
  selectedWeekOrdersChange: number;
  selectedWeekRevenueChange: number;
  selectedMonthOrders: number;
  selectedMonthRevenue: number;
  selectedMonthRevenueCash: number;
  selectedMonthRevenueCard: number;
  selectedMonthOrdersChange: number;
  selectedMonthRevenueChange: number;
  totalRevenueChange: number;
}

interface OrderStatus {
  status: string;
  count: number;
}

interface PaymentMethodDistribution {
  method: string;
  count: number;
  totalAmount: number;
}

interface TopProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  orderCount: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  stockQuantity: number;
  imageUrl: string;
}

interface DashboardData {
  summary: DashboardStats;
  ordersByStatus: OrderStatus[];
  paymentMethodDistribution: PaymentMethodDistribution[];
  topProducts: TopProduct[];
  monthlyRevenue: {
    cash: MonthlyRevenue[];
    card: MonthlyRevenue[];
  };
  lowStockProducts: LowStockProduct[];
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
};

// Fetch dashboard statistics
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (params: { selectedDate?: string; selectedWeek?: string; selectedMonth?: string } = {}, { rejectWithValue }) => {
    try {
      console.log('🔍 Dashboard: Making API call to /dashboard/stats');
      console.log('🔍 Dashboard: Token from localStorage:', !!localStorage.getItem('token'));
      console.log('🔍 Dashboard: Params:', params);
      
      const apiParams: any = {};
      if (params.selectedDate && params.selectedDate !== 'today') {
        apiParams.selectedDate = params.selectedDate;
      }
      if (params.selectedWeek && params.selectedWeek !== 'current') {
        apiParams.selectedWeek = params.selectedWeek;
      }
      if (params.selectedMonth && params.selectedMonth !== 'current') {
        apiParams.selectedMonth = params.selectedMonth;
      }
      
      const response = await client.get('/dashboard/stats', { params: apiParams });
      console.log('🔍 Dashboard: API call successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Dashboard: API call failed:', error);
      console.error('❌ Dashboard: Error response:', error.response);
      console.error('❌ Dashboard: Error status:', error.response?.status);
      console.error('❌ Dashboard: Error data:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch dashboard statistics');
    }
  }
);

// Fetch monthly revenue data
export const fetchMonthlyRevenue = createAsyncThunk(
  'dashboard/fetchMonthlyRevenue',
  async (year: number = new Date().getFullYear(), { rejectWithValue }) => {
    try {
      const response = await client.get(`/dashboard/revenue?year=${year}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch monthly revenue');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<DashboardData>) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer; 