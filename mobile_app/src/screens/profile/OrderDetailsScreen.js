import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dataService, mergeDiscountPromotions } from '../../services/dataService';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const OrderDetailsScreen = ({ navigation, route }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { orderId } = route.params;
  const { getPromotionalPrice, getEffectivePricePerItem } = useCart();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const result = await dataService.orders.getById(orderId);
      
      if (result.success) {
        let orderData = result.data;
        
        // Merge promotional information with order items
        if (orderData.orderItems && orderData.orderItems.length > 0) {
          const productsWithPromotions = await mergeDiscountPromotions(
            orderData.orderItems.map(item => item.product).filter(Boolean)
          );
          
          // Create a map of product ID to product with promotions
          const productMap = {};
          productsWithPromotions.forEach(product => {
            productMap[product.id] = product;
          });
          
          // Update order items with promotional information
          orderData.orderItems = orderData.orderItems.map(item => ({
            ...item,
            product: item.product ? productMap[item.product.id] || item.product : item.product
          }));
        }
        
        setOrder(orderData);
      } else {
        Alert.alert('Error', 'Failed to load order details. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'shipped': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'processing': return 'Processing';
      case 'cancelled': return 'Cancelled';
      case 'shipped': return 'Shipped';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return 'checkmark-circle';
      case 'processing': return 'time';
      case 'cancelled': return 'close-circle';
      case 'shipped': return 'car';
      default: return 'help-circle';
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPromotionBadge = (product) => {
    if (!product || !product.promotion) return null;

    const { promotion } = product;
    let badgeText = '';
    let badgeColor = '#53B175';

    switch (promotion.type) {
      case 'discount':
        badgeText = `${promotion.discountValue}% OFF`;
        badgeColor = '#FF6B35';
        break;
      case '2+1':
        badgeText = '2+1 OFFER';
        badgeColor = '#4CAF50';
        break;
      case 'box':
        badgeText = 'BOX OFFER';
        badgeColor = '#2196F3';
        break;
      default:
        return null;
    }

    return (
      <View style={[styles.promotionBadge, { backgroundColor: badgeColor + '15' }]}>
        <Text style={[styles.promotionBadgeText, { color: badgeColor }]}>
          {badgeText}
        </Text>
      </View>
    );
  };

  const getItemPriceDisplay = (item) => {
    const product = item.product;
    const chargedPrice = parseFloat(item.price || item.unitPrice || 0);
    const currentProductPrice = parseFloat(product?.price || 0);
    
    // Check if current product has promotions
    const hasCurrentPromotion = product && product.promotion;
    const isCurrent2Plus1 = product?.promotion?.type === '2+1' && item.quantity >= 3;
    
    // Get current promotional price
    const currentPromotionalPrice = hasCurrentPromotion ? parseFloat(getPromotionalPrice(product) || currentProductPrice) : currentProductPrice;
    const currentEffectivePrice = hasCurrentPromotion ? parseFloat(getEffectivePricePerItem(product, item.quantity) || currentProductPrice) : currentProductPrice;

    return {
      chargedPrice: chargedPrice || 0,
      currentProductPrice: currentProductPrice || 0,
      currentPromotionalPrice: currentPromotionalPrice || 0,
      currentEffectivePrice: currentEffectivePrice || 0,
      hasCurrentPromotion,
      isCurrent2Plus1,
      // Show current promotional price if available, otherwise show what was charged
      displayPrice: hasCurrentPromotion ? (isCurrent2Plus1 ? currentEffectivePrice : currentPromotionalPrice) : chargedPrice,
      // Show original price if there's a current promotion and it's different from what was charged
      showOriginalPrice: hasCurrentPromotion && Math.abs(currentProductPrice - chargedPrice) > 0.01
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#53B175" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorSubtitle}>The order you're looking for doesn't exist or has been removed.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#00332A" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Order Details</Text>
            <Text style={styles.headerSubtitle}>#{order.orderNumber || order.id}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
              <Ionicons 
                name={getStatusIcon(order.status)} 
                size={16} 
                color={getStatusColor(order.status)} 
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>

          {/* Status Timeline */}
          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={[styles.stepIcon, currentStep >= 1 && styles.stepIconActive]}>
                <Ionicons 
                  name="checkmark" 
                  size={16} 
                  color={currentStep >= 1 ? '#fff' : '#ccc'} 
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, currentStep >= 1 && styles.stepTitleActive]}>
                  Order Placed
                </Text>
                <Text style={styles.stepDate}>
                  {formatDate(order.createdAt || order.date)}
                </Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View style={[styles.stepIcon, currentStep >= 2 && styles.stepIconActive]}>
                <Ionicons 
                  name="car" 
                  size={16} 
                  color={currentStep >= 2 ? '#fff' : '#ccc'} 
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, currentStep >= 2 && styles.stepTitleActive]}>
                  Shipped
                </Text>
                <Text style={styles.stepDate}>
                  {currentStep >= 2 ? 'On the way' : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View style={[styles.stepIcon, currentStep >= 3 && styles.stepIconActive]}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={currentStep >= 3 ? '#fff' : '#ccc'} 
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, currentStep >= 3 && styles.stepTitleActive]}>
                  Delivered
                </Text>
                <Text style={styles.stepDate}>
                  {currentStep >= 3 ? 'Order completed' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <Text style={styles.sectionSubtitle}>
            Promotional badges show current offers. Prices shown are what you were charged.
          </Text>
          {order.orderItems && order.orderItems.length > 0 ? (
            order.orderItems.map((item, index) => {
              const priceInfo = getItemPriceDisplay(item);
              return (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.itemImageContainer}>
                    {item.product?.imageUrl ? (
                      <Image 
                        source={{ uri: item.product.imageUrl }} 
                        style={styles.itemImage}
                        resizeMode="cover"
                        onError={() => {
                          // Image failed to load, will show fallback icon
                        }}
                      />
                    ) : (
                      <Ionicons name="image" size={24} color="#ccc" />
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.product?.name || item.name}</Text>
                      <View style={styles.headerPriceContainer}>
                        {renderPromotionBadge(item.product)}
                        <View style={styles.priceContainer}>
                          <View style={styles.priceRow}>
                            {/* Show current promotional price if available */}
                            {priceInfo.hasCurrentPromotion && (
                              <>
                                <View style={styles.originalPriceContainer}>
                                  <Text style={styles.originalPrice}>
                                    ${priceInfo.currentProductPrice.toFixed(2)}
                                  </Text>
                                  <View style={styles.strikethroughLine} />
                                </View>
                                <Text style={[styles.itemPrice, styles.promotionalPrice]}>
                                  ${priceInfo.displayPrice.toFixed(2)}
                                  {priceInfo.isCurrent2Plus1 && ' each'}
                                </Text>
                              </>
                            )}
                            {/* Show what was actually charged if no current promotion */}
                            {!priceInfo.hasCurrentPromotion && (
                              <Text style={styles.itemPrice}>
                                ${priceInfo.chargedPrice.toFixed(2)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.itemDescription}>
                      {item.product?.description || 'Product description'}
                    </Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    </View>
                    {priceInfo.hasCurrentPromotion && (
                      <Text style={styles.savingsText}>
                        Current offer: ${priceInfo.currentProductPrice.toFixed(2)} → ${priceInfo.displayPrice.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.itemTotal}>
                    <Text style={styles.itemTotalText}>
                      ${((priceInfo.chargedPrice || 0) * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noItemsText}>No items found</Text>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ${(order.totalAmount || order.total).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {order.deliveryFee ? `$${order.deliveryFee.toFixed(2)}` : 'Free'}
              </Text>
            </View>
            {order.discount && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -${order.discount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ${(order.totalAmount || order.total).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#53B175" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Delivery Address</Text>
                <Text style={styles.infoValue}>
                  {order.deliveryAddress || '123 Main St, City, State 12345'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#53B175" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Estimated Delivery</Text>
                <Text style={styles.infoValue}>
                  {order.estimatedDelivery || '2-3 business days'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="card" size={20} color="#53B175" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>
                  {order.paymentMethod || 'Credit Card'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="chatbubble" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Contact Support</Text>
          </TouchableOpacity>
          
          {order.status === 'delivered' && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="star" size={20} color="#53B175" style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>Rate Order</Text>
            </TouchableOpacity>
          )}
          
          {order.status === 'processing' && (
            <TouchableOpacity style={styles.dangerButton}>
              <Ionicons name="close-circle" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.dangerButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00332A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00332A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeline: {
    marginTop: 10,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepIconActive: {
    backgroundColor: '#53B175',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ccc',
    marginBottom: 4,
  },
  stepTitleActive: {
    color: '#00332A',
  },
  stepDate: {
    fontSize: 14,
    color: '#666',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
    minHeight: 20,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00332A',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  headerPriceContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  promotionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  promotionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  originalPriceContainer: {
    position: 'relative',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
  },
  strikethroughLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#999',
    transform: [{ translateY: -0.5 }],
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00332A',
  },
  promotionalPrice: {
    color: '#53B175',
    fontWeight: '700',
  },
  chargedPriceNote: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  savingsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemTotal: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 60,
  },
  itemTotalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#53B175',
  },
  noItemsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  summaryCard: {
    backgroundColor: '#F7F9F8',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00332A',
  },
  discountValue: {
    color: '#4CAF50',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00332A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#53B175',
  },
  infoCard: {
    backgroundColor: '#F7F9F8',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00332A',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#53B175',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#53B175',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#53B175',
  },
  dangerButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00332A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});

export default OrderDetailsScreen; 