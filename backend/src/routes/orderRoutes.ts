import express from 'express';
import orderController from '../controllers/orderController';
import { auth, adminAuth } from '../middlewares/auth';

const router = express.Router();

// Handle OPTIONS requests for CORS preflight
router.options('*', (req, res) => {
  console.log('🔍 CORS Preflight for orders:', req.method, req.url);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.status(200).send();
});

// Customer routes
router.post('/', auth, orderController.createOrder);
router.get('/customer', auth, orderController.getCustomerOrders);
router.get('/customer/:id', auth, orderController.getOrderById);

// Admin routes
router.get('/admin', auth, adminAuth, orderController.getOrders);
router.get('/:id', auth, orderController.getOrderById);
router.patch('/:id/status', auth, adminAuth, orderController.updateOrderStatus);
router.delete('/:id', auth, adminAuth, orderController.deleteOrder);

export default router; 