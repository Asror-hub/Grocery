import { Request, Response } from 'express';
import { Order, Product, Category, OrderItem } from '../models';
import { Op, fn, col, literal } from 'sequelize';

// Helper function to calculate percentage change
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📊 Fetching dashboard statistics...');

    // Get query parameters for custom date ranges
    const { selectedDate, selectedWeek, selectedMonth } = req.query;
    let targetDate = new Date();
    let targetWeek = new Date();
    let targetMonth = new Date();
    
    // If a specific date is provided, use it instead of today
    if (selectedDate && selectedDate !== 'today') {
      targetDate = new Date(String(selectedDate));
      targetDate.setHours(0, 0, 0, 0);
    }
    
    // If a specific week is provided, use it instead of current week
    if (selectedWeek && selectedWeek !== 'current') {
      targetWeek = new Date(String(selectedWeek));
      targetWeek.setHours(0, 0, 0, 0);
    }
    
    // If a specific month is provided, use it instead of current month
    if (selectedMonth && selectedMonth !== 'current') {
      targetMonth = new Date(String(selectedMonth));
      targetMonth.setHours(0, 0, 0, 0);
    }

    // Get total counts
    const totalProducts = await Product.count({ where: { isDeleted: false } });
    const totalCategories = await Category.count({ where: { isDeleted: false } });

    // Calculate date ranges for current periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    // Calculate week ranges based on target week
    const weekStart = new Date(targetWeek);
    weekStart.setDate(targetWeek.getDate() - targetWeek.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);
    
    // Calculate month ranges based on target month
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    // For comparison periods
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate date ranges for previous periods (for comparison)
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    console.log('📅 Date ranges:', {
      today: today.toISOString(),
      yesterday: yesterday.toISOString(),
      oneWeekAgo: oneWeekAgo.toISOString(),
      twoWeeksAgo: twoWeeksAgo.toISOString(),
      oneMonthAgo: oneMonthAgo.toISOString(),
      twoMonthsAgo: twoMonthsAgo.toISOString(),
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString()
    });

    // Get selected day's sales and revenue by payment method
    const selectedDayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: selectedDay,
          [Op.lt]: new Date(selectedDay.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    const selectedDayRevenueCash = await Order.findAll({
      where: {
        paymentMethod: 'cash',
        createdAt: {
          [Op.gte]: selectedDay,
          [Op.lt]: new Date(selectedDay.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      attributes: ['totalAmount']
    });

    const selectedDayRevenueCard = await Order.findAll({
      where: {
        paymentMethod: 'card',
        createdAt: {
          [Op.gte]: selectedDay,
          [Op.lt]: new Date(selectedDay.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      attributes: ['totalAmount']
    });

    const selectedDayTotalRevenueCash = selectedDayRevenueCash.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const selectedDayTotalRevenueCard = selectedDayRevenueCard.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const selectedDayTotalRevenue = selectedDayTotalRevenueCash + selectedDayTotalRevenueCard;

    // Get yesterday's data for comparison
    const yesterdayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: yesterday,
          [Op.lt]: today
        }
      }
    });

    const yesterdayRevenueCash = await Order.findAll({
      where: {
        paymentMethod: 'cash',
        createdAt: {
          [Op.gte]: yesterday,
          [Op.lt]: today
        }
      },
      attributes: ['totalAmount']
    });

    const yesterdayRevenueCard = await Order.findAll({
      where: {
        paymentMethod: 'card',
        createdAt: {
          [Op.gte]: yesterday,
          [Op.lt]: today
        }
      },
      attributes: ['totalAmount']
    });

    const yesterdayTotalRevenueCash = yesterdayRevenueCash.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const yesterdayTotalRevenueCard = yesterdayRevenueCard.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const yesterdayTotalRevenue = yesterdayTotalRevenueCash + yesterdayTotalRevenueCard;

    // Calculate selected day's percentage changes
    const selectedDayOrdersChange = calculatePercentageChange(selectedDayOrders, yesterdayOrders);
    const selectedDayRevenueChange = calculatePercentageChange(selectedDayTotalRevenue, yesterdayTotalRevenue);

    console.log('💰 Selected Day vs Yesterday:', {
      selectedDay: { orders: selectedDayOrders, revenue: selectedDayTotalRevenue },
      yesterday: { orders: yesterdayOrders, revenue: yesterdayTotalRevenue },
      changes: { orders: selectedDayOrdersChange, revenue: selectedDayRevenueChange }
    });

    // Get selected week sales and revenue by payment method
    const selectedWeekOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: weekStart,
          [Op.lte]: weekEnd
        }
      }
    });

    const selectedWeekRevenueCash = await Order.findAll({
      where: {
        paymentMethod: 'cash',
        createdAt: {
          [Op.gte]: weekStart,
          [Op.lte]: weekEnd
        }
      },
      attributes: ['totalAmount']
    });

    const selectedWeekRevenueCard = await Order.findAll({
      where: {
        paymentMethod: 'card',
        createdAt: {
          [Op.gte]: weekStart,
          [Op.lte]: weekEnd
        }
      },
      attributes: ['totalAmount']
    });

    const selectedWeekTotalRevenueCash = selectedWeekRevenueCash.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const selectedWeekTotalRevenueCard = selectedWeekRevenueCard.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const selectedWeekTotalRevenue = selectedWeekTotalRevenueCash + selectedWeekTotalRevenueCard;

    // Get previous week data for comparison
    const previousWeekOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: twoWeeksAgo,
          [Op.lt]: oneWeekAgo
        }
      }
    });

    const previousWeekRevenueCash = await Order.findAll({
      where: {
        paymentMethod: 'cash',
        createdAt: {
          [Op.gte]: twoWeeksAgo,
          [Op.lt]: oneWeekAgo
        }
      },
      attributes: ['totalAmount']
    });

    const previousWeekRevenueCard = await Order.findAll({
      where: {
        paymentMethod: 'card',
        createdAt: {
          [Op.gte]: twoWeeksAgo,
          [Op.lt]: oneWeekAgo
        }
      },
      attributes: ['totalAmount']
    });

    const previousWeekTotalRevenueCash = previousWeekRevenueCash.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const previousWeekTotalRevenueCard = previousWeekRevenueCard.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const previousWeekTotalRevenue = previousWeekTotalRevenueCash + previousWeekTotalRevenueCard;

    // Calculate week's percentage changes
    const selectedWeekOrdersChange = calculatePercentageChange(selectedWeekOrders, previousWeekOrders);
    const selectedWeekRevenueChange = calculatePercentageChange(selectedWeekTotalRevenue, previousWeekTotalRevenue);

    // Get selected month sales and revenue by payment method
    const selectedMonthOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: monthStart,
          [Op.lte]: monthEnd
        }
      }
    });

    const selectedMonthRevenueCash = await Order.findAll({
      where: {
        paymentMethod: 'cash',
        createdAt: {
          [Op.gte]: monthStart,
          [Op.lte]: monthEnd
        }
      },
      attributes: ['totalAmount']
    });

    const selectedMonthRevenueCard = await Order.findAll({
      where: {
        paymentMethod: 'card',
        createdAt: {
          [Op.gte]: monthStart,
          [Op.lte]: monthEnd
        }
      },
      attributes: ['totalAmount']
    });

    const selectedMonthTotalRevenueCash = selectedMonthRevenueCash.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const selectedMonthTotalRevenueCard = selectedMonthRevenueCard.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const selectedMonthTotalRevenue = selectedMonthTotalRevenueCash + selectedMonthTotalRevenueCard;

    // Get previous month data for comparison
    const previousMonthOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: twoMonthsAgo,
          [Op.lt]: oneMonthAgo
        }
      }
    });

    const previousMonthRevenueCash = await Order.findAll({
      where: {
        paymentMethod: 'cash',
        createdAt: {
          [Op.gte]: twoMonthsAgo,
          [Op.lt]: oneMonthAgo
        }
      },
      attributes: ['totalAmount']
    });

    const previousMonthRevenueCard = await Order.findAll({
      where: {
        paymentMethod: 'card',
        createdAt: {
          [Op.gte]: twoMonthsAgo,
          [Op.lt]: oneMonthAgo
        }
      },
      attributes: ['totalAmount']
    });

    const previousMonthTotalRevenueCash = previousMonthRevenueCash.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const previousMonthTotalRevenueCard = previousMonthRevenueCard.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const previousMonthTotalRevenue = previousMonthTotalRevenueCash + previousMonthTotalRevenueCard;

    // Calculate month's percentage changes
    const selectedMonthOrdersChange = calculatePercentageChange(selectedMonthOrders, previousMonthOrders);
    const selectedMonthRevenueChange = calculatePercentageChange(selectedMonthTotalRevenue, previousMonthTotalRevenue);

    // Get total revenue from all orders by payment method
    const allOrdersCash = await Order.findAll({
      where: { paymentMethod: 'cash' },
      attributes: ['totalAmount']
    });

    const allOrdersCard = await Order.findAll({
      where: { paymentMethod: 'card' },
      attributes: ['totalAmount']
    });

    const totalRevenueCash = allOrdersCash.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalRevenueCard = allOrdersCard.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalRevenue = totalRevenueCash + totalRevenueCard;

    // Calculate total revenue change (compare with last 30 days vs previous 30 days)
    const totalRevenueChange = calculatePercentageChange(totalRevenue, previousMonthTotalRevenue);

    console.log('💰 Revenue summary with changes:', {
      selectedDay: { orders: selectedDayOrders, revenue: selectedDayTotalRevenue, change: selectedDayRevenueChange },
      week: { orders: selectedWeekOrders, revenue: selectedWeekTotalRevenue, change: selectedWeekRevenueChange },
      month: { orders: selectedMonthOrders, revenue: selectedMonthTotalRevenue, change: selectedMonthRevenueChange },
      total: { revenue: totalRevenue, change: totalRevenueChange }
    });

    // Get orders by status with proper aggregation
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }).catch(err => {
      console.error('Error fetching orders by status:', err);
      return [];
    });

    // Get payment method distribution
    const paymentMethodDistribution = await Order.findAll({
      attributes: [
        'paymentMethod',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('totalAmount')), 'totalAmount']
      ],
      group: ['paymentMethod'],
      raw: true
    }).catch(err => {
      console.error('Error fetching payment method distribution:', err);
      return [];
    });

    // Get top selling products with proper aggregation
    const topProducts = await Product.findAll({
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'id',
        'name',
        'price',
        'imageUrl',
        [fn('COUNT', col('orderItems.id')), 'orderCount']
      ],
      where: { isDeleted: false },
      group: ['Product.id', 'Product.name', 'Product.price', 'Product.imageUrl'],
      order: [[literal('orderCount'), 'DESC']],
      limit: 8,
      raw: true
    }).catch(err => {
      console.error('Error fetching top products:', err);
      return [];
    });

    // Get monthly revenue for the current year by payment method
    const currentYear = new Date().getFullYear();
    const monthlyRevenueCash = await Order.findAll({
      where: {
        paymentMethod: 'cash',
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        }
      },
      attributes: [
        [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
        [fn('SUM', col('totalAmount')), 'revenue']
      ],
      group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
      order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'ASC']],
      raw: true
    }).catch(err => {
      console.error('Error fetching monthly cash revenue:', err);
      return [];
    });

    const monthlyRevenueCard = await Order.findAll({
      where: {
        paymentMethod: 'card',
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        }
      },
      attributes: [
        [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
        [fn('SUM', col('totalAmount')), 'revenue']
      ],
      group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
      order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'ASC']],
      raw: true
    }).catch(err => {
      console.error('Error fetching monthly card revenue:', err);
      return [];
    });

    // Get low stock products (less than 10 items)
    const lowStockProducts = await Product.findAll({
      where: {
        isDeleted: false,
        stockQuantity: {
          [Op.lt]: 10
        }
      },
      attributes: ['id', 'name', 'stockQuantity', 'imageUrl'],
      limit: 5
    });

    const dashboardData = {
      summary: {
        totalProducts,
        totalCategories,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalRevenueCash: parseFloat(totalRevenueCash.toFixed(2)),
        totalRevenueCard: parseFloat(totalRevenueCard.toFixed(2)),
        selectedDayOrders,
        selectedDayRevenue: parseFloat(selectedDayTotalRevenue.toFixed(2)),
        selectedDayRevenueCash: parseFloat(selectedDayTotalRevenueCash.toFixed(2)),
        selectedDayRevenueCard: parseFloat(selectedDayTotalRevenueCard.toFixed(2)),
        selectedDayOrdersChange: parseFloat(selectedDayOrdersChange.toFixed(1)),
        selectedDayRevenueChange: parseFloat(selectedDayRevenueChange.toFixed(1)),
        selectedWeekOrders,
        selectedWeekRevenue: parseFloat(selectedWeekTotalRevenue.toFixed(2)),
        selectedWeekRevenueCash: parseFloat(selectedWeekTotalRevenueCash.toFixed(2)),
        selectedWeekRevenueCard: parseFloat(selectedWeekTotalRevenueCard.toFixed(2)),
        selectedWeekOrdersChange: parseFloat(selectedWeekOrdersChange.toFixed(1)),
        selectedWeekRevenueChange: parseFloat(selectedWeekRevenueChange.toFixed(1)),
        selectedMonthOrders,
        selectedMonthRevenue: parseFloat(selectedMonthTotalRevenue.toFixed(2)),
        selectedMonthRevenueCash: parseFloat(selectedMonthTotalRevenueCash.toFixed(2)),
        selectedMonthRevenueCard: parseFloat(selectedMonthTotalRevenueCard.toFixed(2)),
        selectedMonthOrdersChange: parseFloat(selectedMonthOrdersChange.toFixed(1)),
        selectedMonthRevenueChange: parseFloat(selectedMonthRevenueChange.toFixed(1)),
        totalRevenueChange: parseFloat(totalRevenueChange.toFixed(1))
      },
      ordersByStatus: ordersByStatus.map((item: any) => ({
        status: item.status,
        count: parseInt(item.count as string)
      })),
      paymentMethodDistribution: paymentMethodDistribution.map((item: any) => ({
        method: item.paymentMethod,
        count: parseInt(item.count as string),
        totalAmount: parseFloat(item.totalAmount as string)
      })),
      topProducts: topProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        orderCount: parseInt(product.orderCount as string)
      })),
      monthlyRevenue: {
        cash: monthlyRevenueCash.map((item: any) => ({
          month: item.month,
          revenue: parseFloat(item.revenue as string)
      })),
        card: monthlyRevenueCard.map((item: any) => ({
          month: item.month,
          revenue: parseFloat(item.revenue as string)
        }))
      },
      lowStockProducts: lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl
      }))
    };

    console.log('✅ Dashboard statistics fetched successfully');
    console.log('📊 Final dashboard data:', JSON.stringify(dashboardData.summary, null, 2));
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get monthly revenue data for charts
export const getMonthlyRevenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyRevenue = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Number(year), 0, 1),
          [Op.lt]: new Date(Number(year) + 1, 0, 1)
        }
      },
      attributes: [
        [fn('DATE_TRUNC', 'month', col('createdAt')), 'month'],
        [fn('SUM', col('totalAmount')), 'revenue']
      ],
      group: [fn('DATE_TRUNC', 'month', col('createdAt'))],
      order: [[fn('DATE_TRUNC', 'month', col('createdAt')), 'ASC']],
      raw: true
    });

    const formattedData = monthlyRevenue.map((item: any) => ({
      month: item.month,
      revenue: parseFloat(item.revenue as string)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
};

// Get chart data for sales analytics
export const getChartData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'week', selected = 'current' } = req.query;
    const periodStr = Array.isArray(period) ? period[0] : period;
    const selectedStr = Array.isArray(selected) ? selected[0] : selected;
    console.log('📊 Fetching chart data for period:', periodStr, 'selected:', selectedStr);

    if (periodStr === 'week') {
      // Calculate the target week based on selection
      let targetDate = new Date();
      
      if (selectedStr && selectedStr !== 'current') {
        const weekNumber = parseInt(String(selectedStr).replace('week-', ''));
        targetDate.setDate(targetDate.getDate() - (weekNumber * 7));
      }
      
      // Get the start of the week (Sunday)
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - targetDate.getDay());
      
      // Get the end of the week (Saturday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      console.log('📅 Week range:', {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString()
      });

      // Get data for each day of the selected week
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        
        // Get cash revenue for this day
        const cashRevenue = await Order.findAll({
          where: {
            paymentMethod: 'cash',
            createdAt: {
              [Op.gte]: startOfDay,
              [Op.lt]: endOfDay
            }
          },
          attributes: ['totalAmount']
        });

        // Get card revenue for this day
        const cardRevenue = await Order.findAll({
          where: {
            paymentMethod: 'card',
            createdAt: {
              [Op.gte]: startOfDay,
              [Op.lt]: endOfDay
            }
          },
          attributes: ['totalAmount']
        });

        const cashTotal = cashRevenue.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const cardTotal = cardRevenue.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        days.push({
          period: date.toLocaleDateString('en-US', { weekday: 'short' }),
          cash: parseFloat(cashTotal.toFixed(2)),
          card: parseFloat(cardTotal.toFixed(2)),
          total: parseFloat((cashTotal + cardTotal).toFixed(2))
        });
      }
      
      res.json(days);
    } else {
      // Calculate the target month based on selection
      let targetDate = new Date();
      
      if (selectedStr && selectedStr !== 'current') {
        const monthNumber = parseInt(String(selectedStr).replace('month-', ''));
        targetDate.setMonth(targetDate.getMonth() - monthNumber);
      }
      
      // Get the start and end of the selected month
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      console.log('📅 Month range:', {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString()
      });

      // Get data for each day of the selected month
      const days = [];
      const daysInMonth = endOfMonth.getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(targetDate.getFullYear(), targetDate.getMonth(), i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        
        // Get cash revenue for this day
        const cashRevenue = await Order.findAll({
          where: {
            paymentMethod: 'cash',
            createdAt: {
              [Op.gte]: startOfDay,
              [Op.lt]: endOfDay
            }
          },
          attributes: ['totalAmount']
        });

        // Get card revenue for this day
        const cardRevenue = await Order.findAll({
          where: {
            paymentMethod: 'card',
            createdAt: {
              [Op.gte]: startOfDay,
              [Op.lt]: endOfDay
            }
          },
          attributes: ['totalAmount']
        });

        const cashTotal = cashRevenue.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const cardTotal = cardRevenue.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        days.push({
          period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          cash: parseFloat(cashTotal.toFixed(2)),
          card: parseFloat(cardTotal.toFixed(2)),
          total: parseFloat((cashTotal + cardTotal).toFixed(2))
        });
      }
      
      res.json(days);
    }
  } catch (error) {
    console.error('❌ Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
}; 