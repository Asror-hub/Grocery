import React, { useEffect, useState } from 'react';
import './DashboardPage.css';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ShoppingCart as OrdersIcon,
  Category as CategoriesIcon,
  Inventory as ProductsIcon,
  AttachMoney as RevenueIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  DateRange as WeekIcon,
  CalendarMonth as MonthIcon,
  CreditCard as CardIcon,
  Money as CashIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { SalesChart } from '../components/SalesChart';
import client from '../api/client';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.dashboard);
  const { token, user } = useAppSelector((state) => state.auth);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week');
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>('current');
  const [selectedMonthDate, setSelectedMonthDate] = useState<string>('current');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (weekPickerOpen && !target.closest('.week-picker-container')) {
        setWeekPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [weekPickerOpen]);

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => {
        dispatch(fetchDashboardStats({ selectedDate, selectedWeek: selectedWeekDate, selectedMonth: selectedMonthDate }));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch, token, selectedDate, selectedWeekDate, selectedMonthDate]);

  const handleRefresh = () => {
    dispatch(fetchDashboardStats({ selectedDate, selectedWeek: selectedWeekDate, selectedMonth: selectedMonthDate }));
    setLastRefresh(new Date());
  };

  const handleChartPeriodChange = (event: React.MouseEvent<HTMLElement>, newPeriod: 'week' | 'month' | null) => {
    if (newPeriod !== null) {
      setChartPeriod(newPeriod);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    if (date) {
      setSelectedDate(date);
    } else {
      setSelectedDate('today');
    }
  };

  const handleWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    if (date) {
      setSelectedWeekDate(date);
    } else {
      setSelectedWeekDate('current');
    }
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    if (date) {
      // Convert YYYY-MM format to YYYY-MM-01 for the backend
      setSelectedMonthDate(date + '-01');
    } else {
      setSelectedMonthDate('current');
    }
  };

  const formatSelectedDate = () => {
    if (selectedDate === 'today') {
      return new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return new Date(selectedDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatSelectedWeek = () => {
    if (selectedWeekDate === 'current') {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const date = new Date(selectedWeekDate);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const formatSelectedMonth = () => {
    if (selectedMonthDate === 'current') {
      return new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    return new Date(selectedMonthDate).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Generate week options for dropdown
  const generateWeekOptions = () => {
    const options = [];
    const today = new Date();
    
    // Current week
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    
    options.push({
      value: 'current',
      label: `This Week (${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`,
      date: currentWeekStart
    });
    
    // Last 8 weeks
    for (let i = 1; i <= 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      options.push({
        value: weekStart.toISOString().split('T')[0],
        label: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        date: weekStart
      });
    }
    
    return options;
  };



  // Generate month options (current month and previous months)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    // Current month
    options.push({
      value: 'current',
      label: 'This Month',
      date: today
    });
    
    // Last 12 months
    for (let i = 1; i <= 12; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      
      options.push({
        value: `month-${i}`,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date: date
      });
    }
    
    return options;
  };

  const weekOptions = generateWeekOptions();
  const monthOptions = generateMonthOptions();


  // Update chart data when period changes
  useEffect(() => {
    const fetchChartData = async () => {
      setChartLoading(true);
      setChartError(null);
      
      try {
        const selectedPeriod = chartPeriod === 'week' ? selectedWeek : selectedMonth;
        console.log('🔍 Dashboard: Fetching chart data for period:', chartPeriod, 'selected:', selectedPeriod);
        const response = await client.get(`/dashboard/chart?period=${chartPeriod}&selected=${selectedPeriod}`);
        console.log('🔍 Dashboard: Chart data received:', response.data);
        setChartData(response.data);
        setChartLoading(false);
      } catch (error: any) {
        console.error('❌ Dashboard: Error fetching chart data:', error);
        console.error('❌ Dashboard: Error response:', error.response);
        setChartError(error.response?.data?.error || 'Failed to load chart data');
        setChartLoading(false);
      }
    };

    if (token) {
      fetchChartData();
    }
  }, [chartPeriod, selectedWeek, selectedMonth, token]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentageChange = (change: number) => {
    if (change === 0) return '0%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeDescription = (change: number) => {
    if (change === 0) return 'No change';
    if (change > 0) return 'Increase';
    return 'Decrease';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!token) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Debug logging
  console.log('🔍 Dashboard data received:', data);
  console.log('💰 Revenue data:', data ? {
    selectedDayRevenue: data.summary.selectedDayRevenue,
    selectedDayRevenueCash: data.summary.selectedDayRevenueCash,
    selectedDayRevenueCard: data.summary.selectedDayRevenueCard,
    selectedDayRevenueChange: data.summary.selectedDayRevenueChange,
    selectedWeekRevenue: data.summary.selectedWeekRevenue,
    selectedWeekRevenueCash: data.summary.selectedWeekRevenueCash,
    selectedWeekRevenueCard: data.summary.selectedWeekRevenueCard,
    selectedWeekRevenueChange: data.summary.selectedWeekRevenueChange,
    selectedMonthRevenue: data.summary.selectedMonthRevenue,
    selectedMonthRevenueCash: data.summary.selectedMonthRevenueCash,
    selectedMonthRevenueCard: data.summary.selectedMonthRevenueCard,
    selectedMonthRevenueChange: data.summary.selectedMonthRevenueChange,
    totalRevenue: data.summary.totalRevenue,
    totalRevenueCash: data.summary.totalRevenueCash,
    totalRevenueCard: data.summary.totalRevenueCard,
    totalRevenueChange: data.summary.totalRevenueChange
  } : 'No data');

  const summaryData = data ? [
    {
      title: 'Daily Sales',
      value: data.summary.selectedDayOrders.toString(),
      subtitle: `${formatCurrency(data.summary.selectedDayRevenue)} total`,
      details: [
        { label: 'Cash', value: formatCurrency(data.summary.selectedDayRevenueCash), icon: <CashIcon />, color: '#2e7d32' },
        { label: 'Card', value: formatCurrency(data.summary.selectedDayRevenueCard), icon: <CardIcon />, color: '#1976d2' }
      ],
      icon: <TodayIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      trend: formatPercentageChange(data.summary.selectedDayRevenueChange),
      trendPositive: data.summary.selectedDayRevenueChange >= 0,
      showDatePicker: true,
      selectedDate: selectedDate,
      formattedDate: formatSelectedDate(),
    },
    {
      title: 'Weekly Sales',
      value: data.summary.selectedWeekOrders.toString(),
      subtitle: `${formatCurrency(data.summary.selectedWeekRevenue)} total`,
      details: [
        { label: 'Cash', value: formatCurrency(data.summary.selectedWeekRevenueCash), icon: <CashIcon />, color: '#2e7d32' },
        { label: 'Card', value: formatCurrency(data.summary.selectedWeekRevenueCard), icon: <CardIcon />, color: '#1976d2' }
      ],
      icon: <WeekIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      trend: formatPercentageChange(data.summary.selectedWeekRevenueChange),
      trendPositive: data.summary.selectedWeekRevenueChange >= 0,
      showWeekPicker: true,
      selectedWeekDate: selectedWeekDate,
    },
    {
      title: 'Monthly Sales',
      value: data.summary.selectedMonthOrders.toString(),
      subtitle: `${formatCurrency(data.summary.selectedMonthRevenue)} total`,
      details: [
        { label: 'Cash', value: formatCurrency(data.summary.selectedMonthRevenueCash), icon: <CashIcon />, color: '#2e7d32' },
        { label: 'Card', value: formatCurrency(data.summary.selectedMonthRevenueCard), icon: <CardIcon />, color: '#1976d2' }
      ],
      icon: <MonthIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      trend: formatPercentageChange(data.summary.selectedMonthRevenueChange),
      trendPositive: data.summary.selectedMonthRevenueChange >= 0,
      showMonthPicker: true,
      selectedMonthDate: selectedMonthDate,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data.summary.totalRevenue),
      subtitle: `${data.summary.totalProducts} products`,
      details: [
        { label: 'Cash', value: formatCurrency(data.summary.totalRevenueCash), icon: <CashIcon />, color: '#2e7d32' },
        { label: 'Card', value: formatCurrency(data.summary.totalRevenueCard), icon: <CardIcon />, color: '#1976d2' }
      ],
      icon: <RevenueIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      trend: formatPercentageChange(data.summary.totalRevenueChange),
      trendPositive: data.summary.totalRevenueChange >= 0,
    },
  ] : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Sales Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Welcome back, {user?.name || 'Admin'}! Here's your sales performance overview.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="textSecondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
      </Typography>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryData.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card sx={{ 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: item.color }}>{item.icon}</Box>
                    
                    {/* Date Picker for Daily Sales - Inline with icon */}
                    {item.showDatePicker && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="date"
                          value={item.selectedDate === 'today' ? new Date().toISOString().split('T')[0] : item.selectedDate}
                          onChange={handleDateChange}
                          className="date-picker-input"
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '12px',
                            backgroundColor: '#fafafa',
                            width: '110px',
                            color: '#333',
                            fontWeight: '500'
                          }}
                        />
                      </Box>
                    )}

                    {/* Week Picker for Weekly Sales - Inline with icon */}
                    {item.showWeekPicker && (
                      <Box className="week-picker-container" sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            setWeekPickerOpen(!weekPickerOpen);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            padding: '6px 10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '12px',
                            backgroundColor: '#fafafa',
                            width: '120px',
                            color: '#333',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#1976d2',
                              backgroundColor: 'white',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <CalendarIcon sx={{ fontSize: 12, color: '#666' }} />
                          <Typography variant="caption" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.selectedWeekDate === 'current' ? 'This Week' : formatSelectedWeek()}
                          </Typography>
                          <ArrowDownIcon 
                            sx={{ 
                              fontSize: 14,
                              transition: 'transform 0.2s ease',
                              transform: weekPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                            }} 
                          />
                        </Box>
                        
                        {/* Week Dropdown */}
                        {weekPickerOpen && (
                          <Box
                            className="week-picker-dropdown"
                            sx={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              backgroundColor: 'white',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                              zIndex: 9999,
                              maxHeight: '240px',
                              overflow: 'auto',
                              mt: 0.5,
                              minWidth: '220px',
                              animation: 'fadeIn 0.2s ease-out',
                              '@keyframes fadeIn': {
                                from: {
                                  opacity: 0,
                                  transform: 'translateY(-8px)'
                                },
                                to: {
                                  opacity: 1,
                                  transform: 'translateY(0)'
                                }
                              }
                            }}
                          >
                            {generateWeekOptions().map((option) => (
                              <Box
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedWeekDate(option.value);
                                  setWeekPickerOpen(false);
                                }}
                                sx={{
                                  padding: '10px 12px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  borderBottom: '1px solid #f0f0f0',
                                  transition: 'background-color 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: '#f8f9fa'
                                  },
                                  '&:first-child': {
                                    borderTopLeftRadius: '6px',
                                    borderTopRightRadius: '6px'
                                  },
                                  '&:last-child': {
                                    borderBottom: 'none',
                                    borderBottomLeftRadius: '6px',
                                    borderBottomRightRadius: '6px'
                                  }
                                }}
                              >
                                {option.label}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Month Picker for Monthly Sales - Inline with icon */}
                    {item.showMonthPicker && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="month"
                          value={item.selectedMonthDate === 'current' ? new Date().toISOString().slice(0, 7) : item.selectedMonthDate.slice(0, 7)}
                          onChange={handleMonthChange}
                          className="date-picker-input"
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '12px',
                            backgroundColor: '#fafafa',
                            width: '110px',
                            color: '#333',
                            fontWeight: '500'
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  
                  <Chip
                    label={item.trend}
                    size="small"
                    color={item.trendPositive ? 'success' : 'error'}
                    icon={item.trendPositive ? <TrendingUpIcon sx={{ fontSize: '1rem' }} /> : <TrendingDownIcon sx={{ fontSize: '1rem' }} />}
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Box>
                
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {item.value}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                  {item.subtitle}
                </Typography>
                
                {/* Payment Method Breakdown */}
                <Box sx={{ mt: 2 }}>
                  {item.details.map((detail) => (
                    <Box key={detail.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: detail.color }}>{detail.icon}</Box>
                        <Typography variant="caption" color="textSecondary">
                          {detail.label}:
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: detail.color }}>
                        {detail.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sales Chart Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Sales Analytics Chart
            </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ToggleButtonGroup
                  value={chartPeriod}
                  exclusive
                  onChange={handleChartPeriodChange}
                  size="small"
                >
                  <ToggleButton value="week">
                    <WeekIcon sx={{ mr: 1 }} />
                    Weekly
                  </ToggleButton>
                  <ToggleButton value="month">
                    <MonthIcon sx={{ mr: 1 }} />
                    Monthly
                  </ToggleButton>
                </ToggleButtonGroup>
                
                {chartPeriod === 'week' ? (
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    {weekOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    {monthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </Box>
                        </Box>
            <SalesChart
              data={chartData}
              loading={chartLoading}
              error={chartError}
              periodType={chartPeriod}
            />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>




        {/* Low Stock Products */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 0, 
            height: 500,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            {/* Header Section */}
            <Box sx={{ 
              p: 3, 
              pb: 2,
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: '#fafafa'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ 
                  p: 1, 
                  backgroundColor: '#fff3cd', 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <WarningIcon sx={{ color: '#856404', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 600, 
                    color: '#1a1a1a',
                    mb: 0.5
                  }}>
                    Low Stock Alert
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    fontWeight: 500
                  }}>
                    Products requiring restock attention
            </Typography>
                </Box>
              </Box>
            </Box>

            {/* Content Section */}
            <Box sx={{ 
              p: 3, 
              backgroundColor: 'white',
              height: 'calc(100% - 90px)',
              overflow: 'auto'
            }}>
              {data && data.lowStockProducts.length > 0 ? (
                <Box>
                  {data.lowStockProducts.map((product, index) => (
                    <Box 
                      key={product.id} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        mb: 1.5,
                        p: 1.5,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 2,
                        border: '1px solid #e8eaed',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#fff3cd',
                          borderColor: '#ffc107',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                        <Avatar
                          src={product.imageUrl}
                          variant="rounded"
                        sx={{ 
                          width: 40, 
                          height: 40,
                          border: '2px solid #e8eaed'
                        }}
                        >
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>
                          {product.name.charAt(0).toUpperCase()}
                        </Typography>
                        </Avatar>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: '#1a1a1a',
                            mb: 0.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                            {product.name}
                          </Typography>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                              className="pulse-animation"
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                backgroundColor: '#dc3545', 
                                borderRadius: '50%'
                              }} 
                            />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#dc3545'
                            }}
                          >
                            {product.stockQuantity} items remaining
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Chip
                        label="Low Stock"
                        size="small"
                        sx={{
                          backgroundColor: '#fff3cd',
                          color: '#856404',
                          border: '1px solid #ffeaa7',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: '#d4edda', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      backgroundColor: '#28a745', 
                      borderRadius: '50%'
                    }} />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    color: '#28a745',
                    fontWeight: 600
                  }}>
                    All Products Well Stocked
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    maxWidth: 200
                  }}>
                    Great job! All your products have sufficient inventory levels.
                      </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>


      </Grid>
    </Box>
  );
}; 