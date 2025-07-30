import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchOrders, deleteOrder, updateOrderStatus } from '../store/slices/ordersSlice';
import { Order } from '../types';
import {
  Card,
  CardContent,
  Typography,
  Button,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const OrdersPage: React.FC = () => {
  // Debug imports
  console.log('🔧 Imported updateOrderStatus:', updateOrderStatus);
  console.log('🔧 Imported updateOrderStatus type:', typeof updateOrderStatus);
  
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newOrderNotification, setNewOrderNotification] = useState(false);
  const [ordersVersion, setOrdersVersion] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    loadOrders();
  }, [dispatch]);

  // Listen for new orders and show notification
  useEffect(() => {
    const handleNewOrder = () => {
      setNewOrderNotification(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setNewOrderNotification(false), 5000);
      // Refresh orders immediately when new order arrives
      loadOrders();
    };

    // Listen for custom event from Socket.IO
    window.addEventListener('newOrderReceived', handleNewOrder);

    return () => {
      window.removeEventListener('newOrderReceived', handleNewOrder);
    };
  }, []);

  const loadOrders = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchOrders()).unwrap();
      setOrdersVersion(prev => prev + 1);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCloseDialog = () => {
    setSelectedOrder(null);
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (orderToDelete) {
      try {
        await dispatch(deleteOrder(orderToDelete.id)).unwrap();
        setDeleteDialogOpen(false);
        setOrderToDelete(null);
      } catch (err) {
        console.error('Failed to delete order:', err);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  const getStatusButtons = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔘 Accept Order button clicked for order:', order.id);
                handleStatusUpdate(order.id, 'processing');
              }}
            >
              Accept Order
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔘 Cancel Order button clicked for order:', order.id);
                handleStatusUpdate(order.id, 'cancelled');
              }}
            >
              Cancel
            </Button>
          </Stack>
        );
      case 'processing':
        return (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LocalShippingIcon />}
            onClick={() => handleStatusUpdate(order.id, 'shipped')}
          >
            Ship Order
          </Button>
        );
      case 'shipped':
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<DoneAllIcon />}
            onClick={() => handleStatusUpdate(order.id, 'delivered')}
          >
            Mark as Delivered
          </Button>
        );
      case 'delivered':
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography color="success.main">Order Completed</Typography>
            <Tooltip title="Delete Order">
              <IconButton
                color="error"
                onClick={() => handleDeleteClick(order)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      case 'cancelled':
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography color="error">Order Cancelled</Typography>
            <Tooltip title="Delete Order">
              <IconButton
                color="error"
                onClick={() => handleDeleteClick(order)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      default:
        return null;
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    console.log('🔧 Attempting to update order status:', { orderId, newStatus });
    console.log('🔧 Redux action being dispatched:', updateOrderStatus);
    console.log('🔧 Dispatch function:', dispatch);
    console.log('🔧 Imported updateOrderStatus:', typeof updateOrderStatus);
    
    try {
      const action = updateOrderStatus({ orderId, status: newStatus });
      console.log('🔧 Action object:', action);
      console.log('🔧 Action function:', typeof action);
      
      const result = await dispatch(action).unwrap();
      console.log('✅ Order status updated successfully:', result);
    } catch (err: any) {
      console.error('❌ Failed to update order status:', err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: err.config,
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers
      });
      // Show error to user
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      alert(`Failed to update order status: ${errorMessage}`);
    }
  };

  const getShortAddress = (deliveryAddress: string) => {
    if (!deliveryAddress) return 'N/A';
    try {
      const addressObj = JSON.parse(deliveryAddress);
      // Try to get street and house number (house number may be part of street or a separate field)
      if (addressObj.street && addressObj.houseNumber) {
        return `${addressObj.street} ${addressObj.houseNumber}`;
      } else if (addressObj.street) {
        return addressObj.street;
      }
      // fallback to stringified address
      return deliveryAddress;
    } catch {
      // Not a JSON string, fallback to original
      return deliveryAddress;
    }
  };

  const renderOrderItem = (order: Order) => (
    <TableRow
      key={order.id}
      onClick={() => handleOrderClick(order)}
      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
    >
      <TableCell>{order.id}</TableCell>
      <TableCell>{order.user?.name || 'N/A'}</TableCell>
      <TableCell>{order.user?.phone || 'N/A'}</TableCell>
      <TableCell>{getShortAddress(order.deliveryAddress)}</TableCell>
      <TableCell>${(order.totalAmount || 0).toFixed(2)}</TableCell>
      <TableCell>
        <Typography
          sx={{
            color:
              order.paymentMethod === 'card' ? 'primary.main' : 'success.main',
            fontWeight: 'bold',
            textTransform: 'capitalize'
          }}
        >
          {order.paymentMethod === 'card' ? 'Card' : 'Cash'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          sx={{
            color:
              order.status === 'delivered'
                ? 'success.main'
                : order.status === 'cancelled'
                ? 'error.main'
                : 'text.primary',
          }}
        >
          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>{new Date(order.createdAt || Date.now()).toLocaleString()}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>{getStatusButtons(order)}</TableCell>
    </TableRow>
  );

  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Orders
      </Typography>
      
      {/* Debug button to test API connection */}
      <Button 
        variant="outlined" 
        onClick={() => {
          console.log('🔧 Testing direct API call...');
          // Test direct API call without Redux
          fetch('http://localhost:5000/api/orders/38/status', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'processing' })
          })
          .then(response => {
            console.log('🔧 Direct API response status:', response.status);
            return response.json();
          })
          .then(data => {
            console.log('🔧 Direct API response data:', data);
          })
          .catch(error => {
            console.error('🔧 Direct API error:', error);
          });
        }}
        sx={{ mb: 2 }}
      >
        Test Direct API Call
      </Button>
      
      <Button 
        variant="outlined" 
        onClick={() => {
          console.log('🔧 Testing API connection...');
          console.log('🔧 Current orders:', orders);
          console.log('🔧 Redux token:', !!token);
          console.log('🔧 Redux user:', user);
          console.log('🔧 LocalStorage token:', !!localStorage.getItem('token'));
          console.log('🔧 Token length:', localStorage.getItem('token')?.length);
          console.log('🔧 Token preview:', localStorage.getItem('token')?.substring(0, 50) + '...');
          
          // Test if backend is reachable
          fetch('http://localhost:5000/api/products')
            .then(response => {
              console.log('🔧 Backend reachable - Status:', response.status);
              return response.json();
            })
            .then(data => {
              console.log('🔧 Backend response:', data);
            })
            .catch(error => {
              console.error('🔧 Backend not reachable:', error);
            });
        }}
        sx={{ mb: 2 }}
      >
        Debug: Check API Connection
      </Button>
      
      {/* Test order status update */}
      {orders.length > 0 && (
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => {
            const firstOrder = orders[0];
            console.log('🔧 Testing order status update for order:', firstOrder.id);
            handleStatusUpdate(firstOrder.id, 'processing');
          }}
          sx={{ mb: 2, ml: 2 }}
        >
          Test: Update First Order
        </Button>
      )}
      
      {/* Test Redux action directly */}
      {orders.length > 0 && (
        <Button 
          variant="outlined" 
          color="warning"
          onClick={() => {
            const firstOrder = orders[0];
            console.log('🔧 Testing Redux action directly for order:', firstOrder.id);
            console.log('🔧 updateOrderStatus function:', updateOrderStatus);
            console.log('🔧 updateOrderStatus type:', typeof updateOrderStatus);
            
            const action = updateOrderStatus({ orderId: firstOrder.id, status: 'processing' });
            console.log('🔧 Action created:', action);
            console.log('🔧 Action type:', typeof action);
            
            dispatch(action).then((result: any) => {
              console.log('🔧 Redux action result:', result);
            }).catch((error: any) => {
              console.error('🔧 Redux action error:', error);
            });
          }}
          sx={{ mb: 2, ml: 2 }}
        >
          Test: Redux Action Direct
        </Button>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Delivery Address</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map(renderOrderItem)}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={!!selectedOrder} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }
        }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              pb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                  Order #{selectedOrder.id}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  px: 2,
                  py: 1,
                  borderRadius: 2
                }}>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                    {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1) || 'Pending'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 'normal' }}>
                {new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}
              </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ p: 4 }}>
                {/* Customer Information Card */}
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ 
                        backgroundColor: '#e3f2fd', 
                        p: 0.5, 
                        borderRadius: 1, 
                        mr: 1.5 
                      }}>
                        <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                          👤
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        Customer Information
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium' }}>
                          Name
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {selectedOrder.user?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium' }}>
                          Phone
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {selectedOrder.user?.phone || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium' }}>
                          Email
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {selectedOrder.user?.email || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Delivery Information Card */}
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        backgroundColor: '#e8f5e8', 
                        p: 0.5, 
                        borderRadius: 1, 
                        mr: 1.5 
                      }}>
                        <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                          🚚
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                        Delivery Information
                      </Typography>
                    </Box>
                    
                    {/* Horizontal Layout with Icons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Address Section */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 2,
                        p: 2,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 2,
                        border: '1px solid #e9ecef'
                      }}>
                        <Box sx={{ 
                          backgroundColor: '#2e7d32', 
                          color: 'white',
                          p: 1, 
                          borderRadius: 1,
                          minWidth: '32px',
                          textAlign: 'center'
                        }}>
                          📍
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            Delivery Address
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1.4 }}>
                            {selectedOrder.deliveryAddress || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Payment Method Section */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        p: 2,
                        backgroundColor: '#f8f9fa',
                        borderRadius: 2,
                        border: '1px solid #e9ecef'
                      }}>
                        <Box sx={{ 
                          backgroundColor: selectedOrder.paymentMethod === 'card' ? '#1976d2' : '#2e7d32', 
                          color: 'white',
                          p: 1, 
                          borderRadius: 1,
                          minWidth: '32px',
                          textAlign: 'center'
                        }}>
                          {selectedOrder.paymentMethod === 'card' ? '💳' : '💵'}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            Payment Method
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: selectedOrder.paymentMethod === 'card' ? '#1976d2' : '#2e7d32' }}>
                            {selectedOrder.paymentMethod === 'card' ? 'Card on Delivery' : 'Cash on Delivery'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Comments Section */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 2,
                        p: 2,
                        backgroundColor: '#fff8e1',
                        borderRadius: 2,
                        border: '1px solid #ffcc02'
                      }}>
                        <Box sx={{ 
                          backgroundColor: '#f57c00', 
                          color: 'white',
                          p: 1, 
                          borderRadius: 1,
                          minWidth: '32px',
                          textAlign: 'center'
                        }}>
                          💬
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            Customer Comments
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontStyle: 'italic',
                            lineHeight: 1.4
                          }}>
                            {selectedOrder.comment || 'No comments provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Order Items Card */}
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        backgroundColor: '#fff3e0', 
                        p: 0.5, 
                        borderRadius: 1, 
                        mr: 1.5 
                      }}>
                        <Typography variant="body1" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                          📦
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                        Order Items ({selectedOrder.orderItems?.length || 0} items)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedOrder.orderItems?.map((item, index) => (
                        <Paper key={item.id} sx={{ 
                          p: 2,
                          borderRadius: 3,
                          backgroundColor: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          border: '1px solid #f0f0f0',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: item.itemType === 'box' 
                              ? 'linear-gradient(90deg, #2e7d32 0%, #4caf50 100%)'
                              : 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                          }
                        }}>
                          {/* Main Content Row */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                            {/* Item Image/Icon */}
                            {item.itemType === 'product' && item.product?.imageUrl ? (
                              <Box sx={{ 
                                width: 60,
                                height: 60,
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '2px solid #f0f0f0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                backgroundColor: '#fafafa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <img 
                                  src={item.product.imageUrl}
                                  alt={item.product.name || 'Product'}
                                  key={`${item.product.id}-${item.product.imageUrl}-${ordersVersion}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                />
                                <Box sx={{ 
                                  display: 'none',
                                  width: '100%',
                                  height: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                  color: 'white',
                                  fontSize: '1.5rem'
                                }}>
                                  🛍️
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ 
                                width: 60,
                                height: 60,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: item.itemType === 'box' 
                                  ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                                  : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                color: 'white',
                                fontSize: '1.5rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}>
                                {item.itemType === 'box' ? '📦' : '🛍️'}
                              </Box>
                            )}
                            
                            {/* Item Details */}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold', 
                                color: '#1a1a1a',
                                mb: 0.5,
                                fontSize: '1rem'
                              }}>
                                {item.itemType === 'box' 
                                  ? item.boxTitle || 'Custom Box'
                                  : item.product?.name || 'Unknown Product'
                                }
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Chip 
                                  label={`Qty: ${item.quantity}`}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                />
                                <Chip 
                                  label={`$${item.price?.toFixed(2) || '0.00'}`}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: '#e8f5e8',
                                    color: '#2e7d32',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </Box>
                            </Box>
                            
                            {/* Total Price */}
                            <Box sx={{ 
                              textAlign: 'center',
                              minWidth: '80px'
                            }}>
                              <Typography variant="body2" sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.75rem',
                                mb: 0.5
                              }}>
                                Total
                              </Typography>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 'bold', 
                                color: '#2e7d32',
                                fontSize: '1.1rem'
                              }}>
                                ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Additional Details */}
                          {(item.itemType === 'box' && ((item.boxProducts && item.boxProducts.length > 0) || item.boxDescription)) && (
                            <Box sx={{ 
                              pt: 1.5,
                              borderTop: '1px solid #f0f0f0'
                            }}>
                              {/* Box Products */}
                              {item.boxProducts && item.boxProducts.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="body2" sx={{ 
                                    color: 'text.secondary', 
                                    fontWeight: 'medium', 
                                    mb: 0.5,
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.5px'
                                  }}>
                                    📋 Contains:
                                  </Typography>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: 0.5
                                  }}>
                                    {item.boxProducts.map((product: any, idx: number) => (
                                      <Chip 
                                        key={idx} 
                                        label={product.name || product.title} 
                                        size="small" 
                                        sx={{ 
                                          backgroundColor: '#f3e5f5', 
                                          color: '#7b1fa2',
                                          fontSize: '0.65rem',
                                          height: '18px',
                                          '& .MuiChip-label': {
                                            px: 0.8
                                          }
                                        }} 
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              
                              {/* Box Description */}
                              {item.boxDescription && (
                                <Box sx={{ 
                                  p: 1,
                                  backgroundColor: '#fff8e1',
                                  borderRadius: 1.5,
                                  border: '1px solid #ffcc02'
                                }}>
                                  <Typography variant="body2" sx={{ 
                                    color: '#f57c00',
                                    fontStyle: 'italic',
                                    fontSize: '0.8rem',
                                    lineHeight: 1.4
                                  }}>
                                    💬 {item.boxDescription}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Order Summary Card */}
                <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ 
                        backgroundColor: '#f3e5f5', 
                        p: 1, 
                        borderRadius: 1, 
                        mr: 2 
                      }}>
                        <Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>
                          💰
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                        Order Summary
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium' }}>
                          Total Amount
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                          ${(selectedOrder.totalAmount || 0).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium' }}>
                          Order Status
                        </Typography>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          px: 2, 
                          py: 1, 
                          borderRadius: 2,
                          backgroundColor: selectedOrder.status === 'delivered' ? '#e8f5e8' : 
                                           selectedOrder.status === 'cancelled' ? '#ffebee' : '#fff3e0',
                          color: selectedOrder.status === 'delivered' ? '#2e7d32' : 
                                 selectedOrder.status === 'cancelled' ? '#d32f2f' : '#f57c00',
                          fontWeight: 'bold'
                        }}>
                          {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1) || 'Pending'}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 'medium' }}>
                          Order Date
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
              <Button 
                onClick={handleCloseDialog} 
                variant="contained"
                sx={{ 
                  px: 4, 
                  py: 1.5, 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this order? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Order Notification */}
      <Snackbar
        open={newOrderNotification}
        autoHideDuration={5000}
        onClose={() => setNewOrderNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNewOrderNotification(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          🎉 New order received! Check the orders list.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrdersPage; 