import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, FlatList } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { dataService } from '../services/dataService';



const BoxDetailsScreen = ({ route, navigation }) => {
  const { boxPromotion } = route.params;
  const [boxProducts, setBoxProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getCartCount, addPromotionalProduct, addToCart, removeFromCart, cart, canAddToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    loadBoxProducts();
  }, [boxPromotion]);

  const loadBoxProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (boxPromotion && boxPromotion.products && Array.isArray(boxPromotion.products)) {
        // Add promotion info to each product in the box
        const productsWithPromotion = boxPromotion.products.map(product => ({
          ...product,
          promotion: {
            id: boxPromotion.id,
            title: boxPromotion.title,
            type: boxPromotion.type,
            price: boxPromotion.price,
            description: boxPromotion.description
          }
        }));
        
        // Add to promotional products store in cart context
        productsWithPromotion.forEach(product => {
          addPromotionalProduct(product);
        });
        
        setBoxProducts(productsWithPromotion);
      } else {
        setError('No products found in this box');
      }
    } catch (error) {
      console.error('Error loading box products:', error);
      setError('Failed to load box contents');
    } finally {
      setLoading(false);
    }
  };



  const calculateIndividualTotal = () => {
    return boxProducts.reduce((total, product) => {
      return total + (parseFloat(product.price) || 0);
    }, 0);
  };

  const calculateSavings = () => {
    const individualTotal = calculateIndividualTotal();
    const boxPrice = parseFloat(boxPromotion.price) || 0;
    return individualTotal - boxPrice;
  };

  // Check if any product in the box is out of stock
  const isOutOfStock = () => {
    if (!boxProducts || !Array.isArray(boxProducts)) {
      return false;
    }
    
    // Check each product's stock
    for (let i = 0; i < boxProducts.length; i++) {
      const product = boxProducts[i];
      
      // Check if stock is 0 (out of stock)
      if (product.stockQuantity === 0) {
        return true;
      }
    }
    
    return false;
  };

  const handleAddToCart = () => {
    // Don't add to cart if any product is out of stock
    if (isOutOfStock()) {
      return;
    }

    setIsAddingToCart(true);
    
    // Add all products from the box to cart
    if (boxProducts && Array.isArray(boxProducts)) {
      boxProducts.forEach(product => {
        addToCart(product.id);
      });
    }
    
    // Show success feedback briefly
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading box contents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Box Details</Text>
        <TouchableOpacity 
          style={styles.cartIconRedesignedRow}
          onPress={() => navigation.navigate('CartScreen')}
        >
          <Ionicons name="cart-outline" size={26} color="#00332A" />
          {getCartCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {getCartCount() > 99 ? '99+' : getCartCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Box Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={boxPromotion.imageUrl ? { uri: boxPromotion.imageUrl } : require('../../assets/images/apple.png')} 
            style={styles.boxImage}
            resizeMode="contain"
          />
        </View>

        {/* Box Basic Info */}
        <View style={styles.boxInfoContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.boxTitle}>{boxPromotion.title}</Text>
            <View style={styles.boxBadge}>
              <Text style={styles.boxBadgeText}>BOX</Text>
            </View>
          </View>
          <Text style={styles.boxDescription}>{boxPromotion.description || 'Carefully curated selection of premium products.'}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.boxPrice}>${boxPromotion.price}</Text>
          </View>
          <Text style={styles.individualTotalText}>
            Individual total: ${calculateIndividualTotal().toFixed(2)}
          </Text>
          <Text style={styles.savingsText}>
            Save ${calculateSavings().toFixed(2)} compared to buying individually!
          </Text>
        </View>

        {/* Box Contents Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube-outline" size={20} color="#53B175" />
            <Text style={styles.cardTitle}>Box Contents</Text>
          </View>
          <Text style={styles.cardSubtitle}>{boxProducts.length} items included:</Text>
          {boxProducts.map((product, index) => (
            <TouchableOpacity 
              key={product.id || index}
              onPress={() => navigation?.navigate('ProductDetailsScreen', { product })}
              style={styles.productItem}
            >
              <View style={styles.productItemContent}>
                <Image 
                  source={product.imageUrl ? { uri: product.imageUrl } : require('../../assets/images/apple.png')} 
                  style={styles.productItemImage}
                  resizeMode="contain"
                />
                <View style={styles.productItemInfo}>
                  <Text style={styles.productItemName}>{product.name}</Text>
                  <Text style={styles.productItemWeight}>{product.description || '500 gm.'}</Text>
                  <Text style={styles.productItemPrice}>${product.price || '0.00'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Box Benefits Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="star-outline" size={20} color="#53B175" />
            <Text style={styles.cardTitle}>Box Benefits</Text>
          </View>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#53B175" />
              <Text style={styles.benefitText}>Save ${calculateSavings().toFixed(2)} compared to buying individually</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#53B175" />
              <Text style={styles.benefitText}>Carefully curated selection of premium products</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#53B175" />
              <Text style={styles.benefitText}>Perfect for meal planning and variety</Text>
            </View>
          </View>
        </View>

        {/* Storage Instructions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="thermometer-outline" size={20} color="#53B175" />
            <Text style={styles.cardTitle}>Storage Instructions</Text>
          </View>
          <Text style={styles.cardContent}>
            Keep refrigerated at 0-4°C. Consume products within their individual expiry dates. 
            Some items may require immediate consumption while others can be stored for longer periods.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {!isOutOfStock() && (
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => setQty(qty > 1 ? qty - 1 : 1)}
            >
              <FontAwesome name="minus" size={16} color="#53B175" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{qty}</Text>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => setQty(qty + 1)}
            >
              <FontAwesome name="plus" size={16} color="#53B175" />
            </TouchableOpacity>
          </View>
        )}
        
        {isOutOfStock() ? (
          <View style={styles.outOfStockContainer}>
            <Ionicons name="close-circle-outline" size={20} color="#999" />
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addToCartBtn, isAddingToCart && styles.addToCartBtnSuccess]}
            onPress={handleAddToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.addToCartText}>Added!</Text>
              </>
            ) : (
              <>
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={styles.addToCartText}>Add box to cart</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#00332A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartIconRedesignedRow: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F9F8',
    paddingBottom: 420,
    marginBottom: 80,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  boxImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  boxInfoContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  boxBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  boxBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  boxTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00332A',
    flex: 1,
  },
  boxDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  boxPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00332A',
  },
  individualTotalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#53B175',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00332A',
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  productItem: {
    marginBottom: 12,
  },
  productItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  productItemImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 12,
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00332A',
    marginBottom: 4,
  },
  productItemWeight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productItemPrice: {
    fontSize: 14,
    color: '#888',
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#53B175',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00332A',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#53B175',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addToCartBtnSuccess: {
    backgroundColor: '#4CAF50',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  outOfStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  outOfStockText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default BoxDetailsScreen; 