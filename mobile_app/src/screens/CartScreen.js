import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { dataService, mergeDiscountPromotions } from '../services/dataService';

// Default products as fallback
const defaultProducts = [
  {
    id: '1',
    name: 'Fresh Apple',
    weight: '500 gm.',
    price: '17.29$',
    image: require('../../assets/images/apple.png'),
  },
  {
    id: '2',
    name: 'Fresh Banana',
    weight: '450 gm.',
    price: '14.29$',
    image: require('../../assets/images/banana.png'),
  },
];

const CartItem = ({ item, onUpdateQuantity, onRemove, onUpdateBoxQuantity, onRemoveBox, getPromotionalPrice, getEffectivePricePerItem }) => {
  const [imageError, setImageError] = useState(false);

  const handleIncrement = () => {
    if (item.type === 'box') {
      onUpdateBoxQuantity(item.id, item.quantity + 1);
    } else {
      const success = onUpdateQuantity(item.id, item.quantity + 1);
      if (!success) {
        // Could show a toast or alert here
        console.log('Cannot add more: stock limit reached');
      }
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      if (item.type === 'box') {
        onUpdateBoxQuantity(item.id, item.quantity - 1);
      } else {
        onUpdateQuantity(item.id, item.quantity - 1);
      }
    } else {
      if (item.type === 'box') {
        onRemoveBox(item.id);
      } else {
        onRemove(item.id);
      }
    }
  };

  const isAtMaxStock = item.stockQuantity !== undefined && item.quantity >= item.stockQuantity;

  return (
    <View style={styles.cartItem}>
      <Image 
        source={item.imageUrl && !imageError ? { uri: item.imageUrl } : (item.image || require('../../assets/images/apple.png'))} 
        style={styles.itemImage}
        resizeMode="contain"
        onError={() => setImageError(true)}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemWeight}>{item.description || item.weight || '500 gm'}</Text>
        <View style={styles.priceContainer}>
          {item.promotion && item.promotion.type === 'discount' ? (
            <>
              <Text style={styles.originalPrice}>${item.price || '0.00'}</Text>
              <Text style={styles.discountedPrice}>${getPromotionalPrice(item).toFixed(2)}</Text>
            </>
          ) : item.promotion && item.promotion.type === '2+1' ? (
            <>
              <Text style={styles.originalPrice}>${item.price || '0.00'}</Text>
              <Text style={styles.discountedPrice}>${getEffectivePricePerItem(item, item.quantity).toFixed(2)} each</Text>
            </>
          ) : (
            <Text style={styles.itemPrice}>${item.price || '0.00'}</Text>
          )}
        </View>
        {item.promotion && item.promotion.type === '2+1' && item.quantity >= 3 && (
          <Text style={styles.savingsText}>
            Save ${((item.price * item.quantity) - (getEffectivePricePerItem(item, item.quantity) * item.quantity)).toFixed(2)} with 2+1 offer!
          </Text>
        )}
      </View>
      <View style={styles.itemActions}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={handleDecrement} style={styles.quantityBtn}>
            <FontAwesome name="minus" size={14} color="#53B175" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            onPress={handleIncrement} 
            style={[styles.quantityBtn, isAtMaxStock && styles.quantityBtnDisabled]}
            disabled={isAtMaxStock}
          >
            <FontAwesome name="plus" size={14} color={isAtMaxStock ? "#B0B0B0" : "#53B175"} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={() => item.type === 'box' ? onRemoveBox(item.id) : onRemove(item.id)} 
          style={styles.removeBtn}
        >
          <Ionicons name="trash-outline" size={20} color="#FF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CartScreen = ({ navigation }) => {
  const [localProducts, setLocalProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { 
    cart, 
    boxCart, 
    products, 
    boxes, 
    updateQuantity, 
    removeItem, 
    updateBoxQuantity, 
    removeBoxItem, 
    getCartCount, 
    clearCart, 
    setProductsData, 
    setBoxesData, 
    getCartTotal, 
    getCartItemsWithPricing, 
    getPromotionalPrice, 
    getEffectivePricePerItem, 
    getProductWithPromotion,
    getBoxWithData 
  } = useCart();

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load products
      const result = await dataService.products.getAll();
      if (result.success) {
        let productsData = result.data?.products || result.data || [];
        // Merge promotional offers into products
        productsData = await mergeDiscountPromotions(productsData);
        setLocalProducts(productsData);
        setProductsData(productsData); // Set products in cart context for stock validation
      } else {
        console.error('Products error:', result.error);
        setError('Failed to load products');
        setLocalProducts(defaultProducts);
        setProductsData(defaultProducts);
      }

      // Load boxes
      const boxResult = await dataService.promotions.getAll({ type: 'box', isActive: true });
      if (boxResult.success) {
        const boxesData = boxResult.data || [];
        setBoxesData(boxesData); // Set boxes in cart context
      } else {
        console.error('Boxes error:', boxResult.error);
        setBoxesData([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Network error. Please check your connection.');
      setLocalProducts(defaultProducts);
    } finally {
      setLoading(false);
    }
  };

  // Get cart items with pricing (includes both products and boxes)
  const cartItems = getCartItemsWithPricing().map(item => ({
    id: item.id,
    quantity: item.quantity,
    name: item.product?.name || item.product?.title || 'Product',
    description: item.product?.description || '500 gm',
    price: item.product?.price || '0.00',
    imageUrl: item.product?.imageUrl,
    image: item.product?.image || require('../../assets/images/apple.png'),
    stockQuantity: item.product?.stockQuantity,
    promotion: item.product?.promotion,
    type: item.type, // 'product' or 'box'
    finalPrice: item.finalPrice,
    originalPrice: item.originalPrice,
    savings: item.savings,
  }));

  const getSubtotal = () => {
    return getCartTotal();
  };

  const getDeliveryFee = () => {
    return getSubtotal() > 50 ? 0 : 5.99;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const handleCheckout = async () => {
    try {
      // Check if user is authenticated
      const isAuth = await dataService.auth.isAuthenticated();
      if (!isAuth) {
        Alert.alert(
          'Authentication Required',
          'Please log in to place an order.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Auth') }
          ]
        );
        return;
      }

      // Check if cart has items
      if (cartItems.length === 0) {
        Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
        return;
      }

      // Navigate to checkout screen
      navigation.navigate('Checkout');
    } catch (error) {
      console.error('Error during checkout:', error);
      Alert.alert('Error', 'Failed to proceed with checkout. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Normal Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#00332A" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            <Text style={styles.headerSubtitle}>{getCartCount()} items in your cart</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="ellipsis-vertical" size={24} color="#00332A" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#53B175" />
          <Text style={styles.loadingText}>Loading cart items...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={80} color="#B0B0B0" />
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtitle}>Add some products to get started</Text>
          <TouchableOpacity 
            style={styles.shopNowBtn}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart Items */}
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                onUpdateBoxQuantity={updateBoxQuantity}
                onRemoveBox={removeBoxItem}
                getPromotionalPrice={getPromotionalPrice}
                getEffectivePricePerItem={getEffectivePricePerItem}
              />
            )}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${getSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {getDeliveryFee() === 0 ? 'Free' : `$${getDeliveryFee().toFixed(2)}`}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${getTotal().toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  header: {
    backgroundColor: '#00332A',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    opacity: 0.9,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00332A',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopNowBtn: {
    backgroundColor: '#53B175',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartList: {
    padding: 20,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00332A',
    marginBottom: 3,
  },
  itemWeight: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#53B175',
  },
  originalPrice: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: 'bold',
  },
  savingsText: {
    fontSize: 12,
    color: '#53B175',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 6,
  },
  quantityBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#53B175',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00332A',
    marginHorizontal: 10,
    minWidth: 18,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 8,
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#00332A',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00332A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00332A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#53B175',
  },
  checkoutBtn: {
    backgroundColor: '#53B175',
    borderRadius: 25,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#53B175',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityBtnDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#B0B0B0',
  },
});

export default CartScreen; 