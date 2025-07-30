import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import customerAuthRoutes from './routes/customerAuthRoutes';
import adminAuthRoutes from './routes/adminAuthRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import userRoutes from './routes/user';
import productRoutes from './routes/product';
import orderRoutes from './routes/orderRoutes';
import categoryRoutes from './routes/category';
import notificationRoutes from './routes/notificationRoutes';
import profileRoutes from './routes/profile';
import authRoutes from './routes/auth';
import promotionRoutes from './routes/promotion';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
import uploadRoutes from './routes/upload';
import { initializeSocket } from './config/socket';
import { createServer } from 'http';
import { User, Category, Product, Order, OrderItem, Promotion, PromotionProduct, Notification, Settings } from './models';
import { initializeB2 } from './config/storage';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.30:3000', 'http://192.168.1.30:3001', 'http://localhost:19006', 'http://192.168.1.30:19006', 'exp://192.168.1.30:19000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// CORS debugging middleware (commented out to reduce logs)
// app.use((req, res, next) => {
//   console.log('🔍 CORS Debug:', {
//     method: req.method,
//     url: req.url,
//     origin: req.headers.origin,
//     'access-control-request-method': req.headers['access-control-request-method'],
//     'access-control-request-headers': req.headers['access-control-request-headers']
//   });
//   next();
// });
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Sync database and start server
const syncDatabase = async () => {
  try {
    // Test database connection first
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Initialize B2 storage
    await initializeB2();
    console.log('Storage initialization completed');

    // Sync all models without forcing
    await sequelize.sync();
    console.log('All models synchronized successfully');

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
};

// Start the application
syncDatabase(); 