import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { dataService, mergeDiscountPromotions } from '../services/dataService';

const ProductCard = ({ product, onAdd, onRemove, navigation, canAddToCart, getPromotionalPrice }) => {
  const [imageError, setImageError] = useState(false);
  const isAtMaxStock = product.stockQuantity !== undefined && product.inCart >= product.stockQuantity;
  
  const renderPromotionBadge = () => {
    if (!product.promotion) return null;
    
    let badgeText = '';
    let badgeColor = '#F9B023';
    
    switch (product.promotion.type) {
      case 'discount':
        badgeText = `${product.promotion.discountValue}% OFF`;
        badgeColor = '#FF4444';
        break;
      case '2+1':
        badgeText = '2+1 OFFER';
        badgeColor = '#FF6B6B';
        break;
      default:
        return null; // Don't show badge for other promotion types
    }
    
    return (
      <View style={[styles.promotionBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.promotionBadgeText}>{badgeText}</Text>
      </View>
    );
  };
  
  return (
    <TouchableOpacity 
      activeOpacity={0.85} 
      onPress={() => navigation?.navigate('ProductDetailsScreen', { product })}
      style={styles.productCard}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={product.imageUrl && !imageError ? { uri: product.imageUrl } : require('../../assets/images/apple.png')} 
          style={styles.productImage}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />
        {renderPromotionBadge()}
      </View>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productWeight}>{product.description || '500 gm.'}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.originalPrice}>${product.price || '0.00'}</Text>
        {product.promotion && product.promotion.type === 'discount' && (
          <Text style={styles.discountedPrice}>
            ${getPromotionalPrice(product).toFixed(2)}
          </Text>
        )}
        {product.promotion && product.promotion.type === '2+1' && (
          <Text style={styles.discountedPrice}>
            2+1 OFFER
          </Text>
        )}
      </View>
      {product.inCart > 0 ? (
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => onRemove(product.id)} style={styles.quantityBtn}>
            <FontAwesome name="minus" size={16} color="#53B175" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{product.inCart}</Text>
          <TouchableOpacity 
            onPress={() => canAddToCart(product.id) && onAdd(product.id)} 
            style={[styles.quantityBtn, isAtMaxStock && { backgroundColor: '#F0F0F0', borderColor: '#B0B0B0' }]} 
            disabled={isAtMaxStock}
          >
            <FontAwesome name="plus" size={16} color={isAtMaxStock ? "#B0B0B0" : "#53B175"} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.addToCartBtn, isAtMaxStock && { backgroundColor: '#F0F0F0' }]} 
          onPress={() => canAddToCart(product.id) && onAdd(product.id)}
          disabled={isAtMaxStock}
        >
          <FontAwesome name="plus" size={18} color={isAtMaxStock ? "#B0B0B0" : "#fff"} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const PromotionsScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cart, addToCart, removeFromCart, getCartCount, canAddToCart, getPromotionalPrice, addPromotionalProduct, setProductsData } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all products first
      const productsResult = await dataService.products.getAll();
      if (productsResult.success) {
        let allProducts = productsResult.data?.products || productsResult.data || [];
        // Merge promotional offers into products
        allProducts = await mergeDiscountPromotions(allProducts);
        
        // Filter for only products that have promotions
        const promotionalProducts = allProducts.filter(product => 
          product.promotion && (product.promotion.type === 'discount' || product.promotion.type === '2+1')
        );
        
        setProducts(promotionalProducts);
        
        // Set all products in cart context for ProductDetailsScreen to access
        setProductsData(allProducts);
      } else {
        console.error('Products error:', productsResult.error);
        setError('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (id) => {
    addToCart(id);
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#00332A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <TouchableOpacity 
          style={styles.cartBtn}
          onPress={() => navigation.navigate('CartScreen')}
        >
          <Ionicons name="cart-outline" size={24} color="#00332A" />
          {getCartCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {getCartCount() > 99 ? '99+' : getCartCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#B0B0B0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search promotions..."
            placeholderTextColor="#B0B0B0"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#B0B0B0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#53B175" />
          <Text style={styles.loadingText}>Loading promotions...</Text>
        </View>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <FlatList
          key="3-columns"
          data={filteredProducts}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard
              product={{ ...item, inCart: cart[item.id] || 0 }}
              onAdd={addToCart}
              onRemove={removeFromCart}
              navigation={navigation}
              canAddToCart={canAddToCart}
              getPromotionalPrice={getPromotionalPrice}
            />
          )}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No promotional products found</Text>
            </View>
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 5,
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
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterBtn: {
    marginLeft: 10,
  },
  productsContainer: {
    padding: 8,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 14,
    margin: 3,
    marginBottom: 15,
    flex: 1,
    maxWidth: '32%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  promotionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 40,
  },
  promotionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
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
  productName: {
    fontWeight: 'bold',
    color: '#00332A',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 3,
  },
  productWeight: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  productPrice: {
    fontWeight: 'bold',
    color: '#00332A',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  addToCartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#53B175',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 4,
    marginTop: 1,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#53B175',
    marginHorizontal: 6,
  },
  quantityText: {
    fontWeight: 'bold',
    color: '#00332A',
    fontSize: 14,
    minWidth: 18,
    textAlign: 'center',
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
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default PromotionsScreen; 