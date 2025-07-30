import { Request, Response, NextFunction } from 'express';
import { Order, OrderItem, Product, User, Notification } from '../models';
import sequelize from '../config/database';
import { createOrderNotification } from './notificationController';
import { getIO } from '../config/socket';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

interface CreateOrderRequest extends AuthenticatedRequest {
  body: {
    items: Array<{
      productId?: number;
      boxId?: number;
      quantity: number;
      price: number;
      itemType: 'product' | 'box';
      boxTitle?: string;
      boxDescription?: string;
      boxProducts?: any[];
    }>;
    deliveryAddress: string;
    comment?: string;
    totalAmount: number;
    paymentMethod: 'cash' | 'card';
  }
}

interface GetOrderRequest extends AuthenticatedRequest {
  params: {
    id: string;
  }
}

interface GetOrdersRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    status?: string;
    userId?: string;
  }
}

interface UpdateOrderStatusRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
  body: {
    status: string;
  }
}

const orderController = {
  // Create new order
  createOrder: async (req: CreateOrderRequest, res: Response): Promise<void> => {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🔍 Backend: Creating order with data:', req.body);
      console.log('🔍 Backend: User ID:', req.user?.id);
      
      const { items, deliveryAddress, comment, totalAmount, paymentMethod } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        console.log('❌ Backend: No user ID found');
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      console.log('🔍 Backend: Creating order in database...');
      const order = await Order.create({
        userId,
        totalAmount,
        deliveryAddress,
        comment,
        paymentMethod,
        status: 'pending',
        paymentStatus: 'pending'
      }, { transaction });
if (!order) {
  res.status(404).json({ message: 'Order not found' });
  return;
}


      console.log('🔍 Backend: Order created with ID:', order.id);

      console.log('🔍 Backend: Creating order items...');
      const orderItems = await Promise.all(
        items.map(async (item: any) => {
          console.log('🔍 Backend: Processing item:', {
            itemType: item.itemType,
            productId: item.productId,
            boxId: item.boxId,
            quantity: item.quantity,
            receivedPrice: item.price
          });
          
          if (item.itemType === 'product') {
            // Handle product items
            const product = await Product.findByPk(item.productId);
            if (!product) {
              throw new Error(`Product with id ${item.productId} not found`);
            }
            
            console.log('🔍 Backend: Product found:', {
              productId: product.id,
              productName: product.name,
              originalPrice: product.price,
              receivedPrice: item.price,
              willUsePrice: item.price || product.price
            });
            
            // Decrement stock quantity
            if (product.stockQuantity < item.quantity) {
              throw new Error(`Not enough stock for product ${product.name}`);
            }
            product.stockQuantity -= item.quantity;
            await product.save({ transaction });
            
            const orderItem = await OrderItem.create({
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price || product.price,
              itemType: 'product'
            }, { transaction });
            
            console.log('🔍 Backend: Product order item created:', {
              orderItemId: orderItem.id,
              storedPrice: orderItem.price,
              quantity: orderItem.quantity,
              totalForItem: orderItem.price * orderItem.quantity
            });
            
            return orderItem;
          } else if (item.itemType === 'box') {
            // Handle box items
            console.log('🔍 Backend: Creating box order item:', {
              boxId: item.boxId,
              boxTitle: item.boxTitle,
              quantity: item.quantity,
              price: item.price
            });
            
            // For boxes, we'll use the first product in the box as a reference
            // This is a workaround for the database constraint issue
            const firstProductId = item.boxProducts && item.boxProducts.length > 0 
              ? item.boxProducts[0].id 
              : null;
            
            const orderItem = await OrderItem.create({
              orderId: order.id,
              productId: firstProductId, // Use first product as reference for boxes
              quantity: item.quantity,
              price: item.price,
              itemType: 'box',
              boxId: item.boxId,
              boxTitle: item.boxTitle,
              boxDescription: item.boxDescription,
              boxProducts: item.boxProducts
            }, { transaction });
            
            console.log('🔍 Backend: Box order item created:', {
              orderItemId: orderItem.id,
              boxTitle: orderItem.boxTitle,
              quantity: orderItem.quantity,
              totalForItem: orderItem.price * orderItem.quantity
            });
            
            return orderItem;
          } else {
            throw new Error(`Invalid item type: ${item.itemType}`);
          }
        })
      );

      console.log('🔍 Backend: Order items created:', orderItems.length);

      await transaction.commit();
      console.log('🔍 Backend: Transaction committed successfully');

      // Create initial notification
      await Notification.create({
        userId,
        orderId: order.id,
        message: 'Your order has been submitted successfully. Waiting for shop approval.',
        type: 'order_status',
        read: false
      });

      console.log('🔍 Backend: Notification created');



      // Get the complete order with user and items
      const completeOrder = await Order.findByPk(order.id, {
        include: [
          { model: User, as: 'user' },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{ 
              model: Product, 
              as: 'product',
              required: false // Make it optional for boxes
            }]
          }
        ]
      });

      if (completeOrder) {
        console.log('🔍 Backend: OrderItems returned to admin:', (completeOrder.orderItems as any[])?.map((oi: any) => ({
          id: oi.id,
          productId: oi.productId,
          price: oi.price,
          productName: oi.product?.name
        })));
      }

      // Emit new order event to admin
      const io = getIO();
      if (io) {
        console.log('🔍 Backend: Emitting new_order event to admin');
        io.emit('new_order', {
          order: completeOrder
        });
      }

      console.log('✅ Backend: Order created successfully');
      res.status(201).json({
        message: 'Order created successfully',
        order: {
          ...order.toJSON(),
          orderItems
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Backend: Error creating order:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  },

  // Get customer's orders
  getCustomerOrders: async (req: GetOrdersRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const orders = await Order.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{ 
              model: Product, 
              as: 'product',
              required: false // Make it optional for boxes
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  },

  // Get all orders (admin only)
  getOrders: async (req: GetOrdersRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.id || req.user.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      const orders = await Order.findAll({
        where: {
          deletedAt: null // Only show non-deleted orders to admin
        },
        include: [
          { model: User, as: 'user' },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{ 
              model: Product, 
              as: 'product',
              required: false // Make it optional for boxes
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  },

  // Get order by ID
  getOrderById: async (req: GetOrderRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await Order.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'imageUrl'],
              required: false // Make it optional for boxes
            }]
          }
        ]
      });
if (!order) {
  res.status(404).json({ message: 'Order not found' });
  return;
}


      if (!order) {
        res.status(404).json({ message: 'Order not found' });
        return;
      }

      // Transform the response to match expected structure
      const orderResponse = {
        id: order.id,
        userId: order.userId,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: (order as any).user,
        orderItems: (order as any).orderItems?.map((item: any) => {
          if (item.itemType === 'box') {
            return {
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              itemType: item.itemType,
              boxId: item.boxId,
              boxTitle: item.boxTitle,
              boxDescription: item.boxDescription,
              boxProducts: item.boxProducts,
              product: null // No product for boxes
            };
          } else {
            return {
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              itemType: item.itemType,
              product: item.product
            };
          }
        }) || []
      };

      res.json(orderResponse);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Error fetching order' });
    }
  },

  // Update order status
  updateOrderStatus: async (req: UpdateOrderStatusRequest, res: Response): Promise<void> => {
    console.log('🔧 Backend: Update order status request received:', {
      orderId: req.params.id,
      newStatus: req.body.status,
      user: req.user
    });
    
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!req.user?.id || req.user.role !== 'admin') {
        console.log('❌ Backend: Authentication failed - user:', req.user);
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      const order = await Order.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'phone']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }]
          }
        ]
      });

      if (!order) {
        console.log('❌ Backend: Order not found with ID:', id);
        res.status(404).json({ message: 'Order not found' });
        return;
      }

      console.log('✅ Backend: Order found, updating status from', order.status, 'to', status);
      
      // Update order status
      order.status = status as any; // Type assertion to fix type issue
      await order.save();
      
      console.log('✅ Backend: Order status updated successfully');



      // Emit socket event for order status update
      const io = getIO();
      if (io) {
        // Emit to admin with complete order data
        io.emit('orderStatusUpdated', {
          orderId: order.id,
          status: order.status,
          updatedAt: order.updatedAt,
          order: {
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            user: (order as any).user,
            orderItems: (order as any).orderItems?.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price
              }
            })) || []
          }
        });

        // Emit to specific customer
        io.to(`user_${order.userId}`).emit('orderStatusUpdated', {
          orderId: order.id,
          status: order.status,
          updatedAt: order.updatedAt,
          order: {
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            orderItems: (order as any).orderItems?.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price
              }
            })) || []
          }
        });
      }



      // Create notification record
      await Notification.create({
        userId: order.userId,
        orderId: order.id,
        message: `Your order status has been updated to: ${status}`,
        type: 'order_status',
        read: false
      });

      res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Error updating order status' });
    }
  },

  // Delete order (soft delete - only hides from admin view)
  deleteOrder: async (req: GetOrderRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!req.user?.id || req.user.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      const order = await Order.findByPk(id);

      if (!order) {
        res.status(404).json({ message: 'Order not found' });
        return;
      }

      // Only allow deletion of delivered or cancelled orders
      if (order.status !== 'delivered' && order.status !== 'cancelled') {
        res.status(400).json({ 
          message: 'Only delivered or cancelled orders can be deleted' 
        });
        return;
      }

      // Soft delete - set deletedAt timestamp
      order.deletedAt = new Date();
      await order.save();

      // Emit order deleted event (only for admin)
      const io = getIO();
      if (io) {
        io.emit('order_deleted', { orderId: id });
      }

      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ message: 'Failed to delete order' });
    }
  }
};

export default orderController; 