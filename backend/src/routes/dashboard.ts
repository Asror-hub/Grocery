import express from 'express';
import { getDashboardStats, getMonthlyRevenue, getChartData } from '../controllers/dashboardController';
import { auth, adminAuth } from '../middlewares/auth';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', auth, adminAuth, getDashboardStats);

// Get monthly revenue data
router.get('/revenue', auth, adminAuth, getMonthlyRevenue);

// Get chart data for sales analytics
router.get('/chart', auth, adminAuth, getChartData);

export default router; 