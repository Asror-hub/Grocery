import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

const ProductDetailsScreen = ({ route, navigation }) => {
  // Get product from route params, with fallback for demo
  const product = route?.params?.product || {
    id: '6', // Add an ID for cart functionality
    name: 'Beef Mixed Cut Bone',
    weight: '1000 gm',
    price: '23.46$',
    image: require('../../assets/images/beef.png'),
    description: 'Premium quality beef mixed cut with bone, sourced from grass-fed cattle. Perfect for slow cooking, stews, and traditional recipes.'
  };
  
  const [qty, setQty] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { getCartCount, updateQuantity, cart, products, getProductWithPromotion, addPromotionalProduct } = useCart();
  // Try to get the product with promotion data from cart context first
  const productFromContext = products.find(p => p.id.toString() === product.id.toString());
  const effectiveProduct = productFromContext || product;
  
  // If the product doesn't have promotion data, try to get it from promotional products
  const promotionalProduct = getProductWithPromotion(effectiveProduct.id);
  const finalProduct = promotionalProduct || effectiveProduct;
  
  // Debug: Log what we found
  console.log('ProductDetailsScreen Debug:');
  console.log('- Product ID:', product.id);
  console.log('- Product from context:', !!productFromContext);
  console.log('- Product from promotional store:', !!promotionalProduct);
  console.log('- Final product has promotion:', !!finalProduct.promotion);
  if (finalProduct.promotion) {
    console.log('- Promotion type:', finalProduct.promotion.type);
    console.log('- Promotion discount:', finalProduct.promotion.discountValue);
  }
  

  const currentCartQty = cart[finalProduct.id] || 0;
  const isOutOfStock = finalProduct.stockQuantity !== undefined && finalProduct.stockQuantity === 0;

  // Calculate promotional price
  const getPromotionalPrice = (product) => {
    if (!product || !product.promotion) {
      return parseFloat(product?.price) || 0;
    }
    if (product.promotion.type === 'discount') {
      const discountValue = product.promotion.discountValue || 0;
      const originalPrice = parseFloat(product.price) || 0;
      return originalPrice * (1 - discountValue / 100);
    }
    return parseFloat(product.price) || 0;
  };

  // Render promotion badge
  const renderPromotionBadge = () => {
    if (!finalProduct.promotion) return null;
    
    let badgeText = '';
    let badgeColor = '#FF4444';
    
    switch (finalProduct.promotion.type) {
      case 'discount':
        badgeText = `${finalProduct.promotion.discountValue}% OFF`;
        badgeColor = '#FF4444';
        break;
      case '2+1':
        badgeText = '2+1 OFFER';
        badgeColor = '#FF6B6B';
        break;
      default:
        return null;
    }
    
    return (
      <View style={[styles.promotionBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.promotionBadgeText}>
          {badgeText}
        </Text>
      </View>
    );
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    // Add promotional product to cart context if it has promotion
    if (finalProduct.promotion) {
      addPromotionalProduct(finalProduct);
    }
    
    // Calculate the new total quantity (current cart + selected quantity)
    const newTotalQuantity = currentCartQty + qty;
    
    // Check if the new total quantity exceeds stock
    if (finalProduct.stockQuantity !== undefined && newTotalQuantity > finalProduct.stockQuantity) {
      console.log('Cannot add: would exceed stock limit');
      setIsAddingToCart(false);
      return;
    }
    
    // Update the cart with the new total quantity
    const success = updateQuantity(finalProduct.id, newTotalQuantity);
    
    if (success) {
      console.log(`Added ${qty} items to cart. Total: ${newTotalQuantity}`);
    } else {
      console.log('Failed to add items to cart');
    }
    
    // Show success feedback briefly
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
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
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={finalProduct.imageUrl && !imageError ? { uri: finalProduct.imageUrl } : (finalProduct.image || require('../../assets/images/apple.png'))} 
            style={styles.productImage}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        </View>

        {/* Product Basic Info */}
        <View style={styles.productInfoContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.productName}>{finalProduct.name}</Text>
            {renderPromotionBadge()}
          </View>
          <Text style={styles.weightText}>{finalProduct.description || finalProduct.weight || '500 gm'}</Text>
          <View style={styles.priceContainer}>
            {finalProduct.promotion && finalProduct.promotion.type === 'discount' ? (
              <>
                <Text style={styles.originalPrice}>${parseFloat(finalProduct.price || 0).toFixed(2)}</Text>
                <Text style={styles.discountedPrice}>${getPromotionalPrice(finalProduct).toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.priceText}>${parseFloat(finalProduct.price || 0).toFixed(2)}</Text>
            )}
          </View>
          <Text style={styles.description}>
            {finalProduct.description || 'Premium quality product, carefully selected for the best taste and nutrition.'}
          </Text>
          {finalProduct.stockQuantity !== undefined && (
            <View style={styles.stockInfo}>
              <Ionicons name="checkmark-circle" size={16} color={finalProduct.stockQuantity > 0 ? "#53B175" : "#FF4444"} />
              <Text style={[styles.stockInfoText, { color: finalProduct.stockQuantity > 0 ? "#53B175" : "#FF4444" }]}>
                {finalProduct.stockQuantity > 0 ? `${finalProduct.stockQuantity - currentCartQty} left in stock` : 'Out of stock'}
              </Text>
            </View>
          )}
          {currentCartQty > 0 && (
            <View style={styles.cartInfo}>
              <Ionicons name="cart" size={16} color="#53B175" />
              <Text style={styles.cartInfoText}>
                {currentCartQty} {currentCartQty === 1 ? 'item' : 'items'} in cart
              </Text>
            </View>
          )}
        </View>

        {/* Ingredients Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf-outline" size={20} color="#53B175" />
            <Text style={styles.cardTitle}>Ingredients</Text>
          </View>
          <Text style={styles.cardContent}>
            {finalProduct.categoryId === 2 ? '100% Pure Meat, No artificial preservatives, No added hormones' :
             finalProduct.categoryId === 4 ? 'Fresh vegetables, No artificial preservatives, Naturally grown' :
             finalProduct.categoryId === 5 ? 'Fresh fruits, No artificial preservatives, Naturally grown' :
             finalProduct.categoryId === 3 ? 'Natural ingredients, No artificial preservatives' :
             finalProduct.categoryId === 6 ? 'Fresh dairy, No artificial preservatives, Natural ingredients' :
             '100% Natural ingredients, No artificial preservatives, No added hormones'}
          </Text>
        </View>

        {/* Nutritional Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="nutrition-outline" size={20} color="#53B175" />
            <Text style={styles.cardTitle}>Nutritional Information</Text>
          </View>
          <Text style={styles.cardSubtitle}>Per 100g serving:</Text>
          <View style={styles.nutritionList}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories:</Text>
              <Text style={styles.nutritionValue}>250 kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein:</Text>
              <Text style={styles.nutritionValue}>26g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat:</Text>
              <Text style={styles.nutritionValue}>15g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Iron:</Text>
              <Text style={styles.nutritionValue}>2.5mg</Text>
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
            {finalProduct.categoryId === 2 ? 'Keep refrigerated at 0-4°C. Consume within 3 days of opening or freeze for up to 6 months.' :
             finalProduct.categoryId === 4 ? 'Keep refrigerated at 0-4°C. Consume within 7 days of purchase.' :
             finalProduct.categoryId === 5 ? 'Keep refrigerated at 0-4°C. Consume within 5 days of purchase.' :
             finalProduct.categoryId === 3 ? 'Store in a cool, dry place. Consume within 7 days of opening.' :
             finalProduct.categoryId === 6 ? 'Keep refrigerated at 0-4°C. Consume within 5 days of opening.' :
             'Store in a cool, dry place. Consume within 7 days of opening.'}
          </Text>
        </View>

        {/* Product Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#53B175" />
            <Text style={styles.cardTitle}>Product Details</Text>
          </View>
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Country of Origin:</Text>
              <Text style={styles.detailValue}>Australia</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Best Before:</Text>
              <Text style={styles.detailValue}>See package for expiry date</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {!isOutOfStock && (
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => setQty(qty > 1 ? qty - 1 : 1)}
            >
              <FontAwesome name="minus" size={16} color="#53B175" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{qty}</Text>
            <TouchableOpacity 
              style={[styles.qtyBtn, (currentCartQty + qty >= finalProduct.stockQuantity) && styles.qtyBtnDisabled]} 
              onPress={() => {
                if (currentCartQty + qty < finalProduct.stockQuantity) {
                  setQty(qty + 1);
                }
              }}
              disabled={currentCartQty + qty >= finalProduct.stockQuantity}
            >
              <FontAwesome name="plus" size={16} color={(currentCartQty + qty >= finalProduct.stockQuantity) ? "#B0B0B0" : "#53B175"} />
            </TouchableOpacity>
          </View>
        )}
        
        {isOutOfStock ? (
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
                <Text style={styles.addToCartText}>Add to cart</Text>
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
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },

  promotionBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  promotionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfoContainer: {
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
  productImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00332A',
    flex: 1,
  },
  weightText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    gap: 8,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00332A',
  },
  originalPrice: {
    fontSize: 20,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F7F9F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cartInfoText: {
    fontSize: 14,
    color: '#53B175',
    fontWeight: '600',
    marginLeft: 8,
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
  cardContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00332A',
    marginBottom: 12,
  },
  nutritionList: {
    gap: 8,
  },
  nutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00332A',
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00332A',
    flex: 1,
    textAlign: 'right',
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
  qtyBtnDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#B0B0B0',
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
  cartIconRedesignedRow: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
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
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  stockInfoText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cartInfoText: {
    fontSize: 14,
    color: '#53B175',
    fontWeight: '600',
    marginLeft: 6,
  },
  outOfStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 24,
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

export default ProductDetailsScreen; 