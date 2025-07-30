import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SalesData {
  period: string;
  cash: number;
  card: number;
  total: number;
}

interface SalesChartProps {
  data: SalesData[];
  loading: boolean;
  error: string | null;
  periodType: 'week' | 'month';
}

export const SalesChart: React.FC<SalesChartProps> = ({ data, loading, error, periodType }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate total sales for the period
  const totalSales = data.reduce((sum, item) => sum + item.total, 0);
  const totalCash = data.reduce((sum, item) => sum + item.cash, 0);
  const totalCard = data.reduce((sum, item) => sum + item.card, 0);

  const chartData = {
    labels: data.map(item => item.period),
    datasets: [
      {
        label: 'Cash',
        data: data.map(item => item.cash),
        backgroundColor: '#34a853',
        borderColor: '#34a853',
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Card',
        data: data.map(item => item.card),
        backgroundColor: '#1a73e8',
        borderColor: '#1a73e8',
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          },
          color: '#5f6368'
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e8eaed',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}`;
          },
          afterBody: function(context: any) {
            const total = context.reduce((sum: number, item: any) => sum + item.parsed.y, 0);
            return [`Total: ${formatCurrency(total)}`];
          }
        }
      }
    },
    scales: {
              x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#5f6368',
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f0f0f0',
            drawBorder: false
          },
          ticks: {
            color: '#5f6368',
            font: {
              size: 11
            },
            callback: function(value: any) {
              return formatCurrency(value);
            }
          }
        }
    },
    elements: {
      bar: {
        borderRadius: 4,
        borderSkipped: false
      }
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress size={60} />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 400 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <Typography color="textSecondary">No sales data available</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      p: 0, 
      height: 600,
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
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          color: '#1a1a1a',
          mb: 1
        }}>
          Sales Analytics
        </Typography>
        <Typography variant="body2" sx={{ 
          color: '#666',
          fontWeight: 500
        }}>
          {periodType === 'week' ? 'Weekly' : 'Monthly'} Performance Overview
        </Typography>
      </Box>

      {/* Total Sales Summary */}
      {data && data.length > 0 && (
        <Box sx={{ 
          p: 1, 
          pb: 0,
          backgroundColor: 'white'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 0.5,
            p: 1,
            backgroundColor: '#f8f9fa',
            borderRadius: 2.5,
            border: '1px solid #e8eaed'
          }}>
            <Box>
              <Typography variant="body2" sx={{ 
                color: '#5f6368', 
                mb: 0.5,
                fontWeight: 500,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px'
              }}>
                Total {periodType === 'week' ? 'Weekly' : 'Monthly'} Sales
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700, 
                color: '#1a73e8',
                lineHeight: 1.2
              }}>
                {formatCurrency(totalSales)}
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5,
              alignItems: 'center'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 0.75,
                backgroundColor: 'white',
                borderRadius: 2,
                border: '1px solid #e8eaed',
                minWidth: 140,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  backgroundColor: '#34a853', 
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px rgba(52, 168, 83, 0.2)'
                }} />
                <Box>
                  <Typography variant="caption" sx={{ 
                    color: '#5f6368', 
                    display: 'block',
                    fontWeight: 500,
                    fontSize: '0.7rem'
                  }}>
                    Cash Sales
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 600,
                    color: '#1a1a1a'
                  }}>
                    {formatCurrency(totalCash)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 0.75,
                backgroundColor: 'white',
                borderRadius: 2,
                border: '1px solid #e8eaed',
                minWidth: 140,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  backgroundColor: '#1a73e8', 
                  borderRadius: '50%',
                  boxShadow: '0 0 0 2px rgba(26, 115, 232, 0.2)'
                }} />
                <Box>
                  <Typography variant="caption" sx={{ 
                    color: '#5f6368', 
                    display: 'block',
                    fontWeight: 500,
                    fontSize: '0.7rem'
                  }}>
                    Card Sales
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 600,
                    color: '#1a1a1a'
                  }}>
                    {formatCurrency(totalCard)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Chart Section */}
      <Box sx={{ 
        p: 3, 
        pt: 0,
        backgroundColor: 'white',
        flex: 1
      }}>
        <Box sx={{ 
          height: 380,
          position: 'relative'
        }}>
          <Bar data={chartData} options={options} />
        </Box>
      </Box>
    </Paper>
  );
}; 