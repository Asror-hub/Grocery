import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { dataService, mergeDiscountPromotions } from '../services/dataService';

const { width } = Dimensions.get('window');

// Default categories as fallback
const defaultCategories = [
  { id: '1', name: 'Meats', active: false },
  { id: '2', name: 'Vegetables', active: true },
  { id: '3', name: 'Fruits', active: false },
  { id: '4', name: 'Breads', active: false },
];



const ProductCard = ({ product, count, onAdd, onRemove, navigation }) => {
  const isAtMaxStock = product.stockQuantity !== undefined && count >= product.stockQuantity;
  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity === 0;
  const [imageError, setImageError] = useState(false);
  
  // Calculate promotional price
  const getPromotionalPrice = (product) => {
    if (!product || !product.promotion) {
      return product?.price || 0;
    }
    if (product.promotion.type === 'discount') {
      const discountValue = product.promotion.discountValue || 0;
      return (product.price || 0) * (1 - discountValue / 100);
    }
    return product.price || 0;
  };

  // Render promotion badge
  const renderPromotionBadge = () => {
    if (!product.promotion) return null;
    
    let badgeText = '';
    let badgeColor = '#FF4D4D';
    
    switch (product.promotion.type) {
      case 'discount':
        badgeText = `${product.promotion.discountValue}% OFF`;
        badgeColor = '#FF4D4D';
        break;
      case '2+1':
        badgeText = '2+1 OFFER';
        badgeColor = '#FF6B6B';
        break;
      default:
        return null;
    }
    
    return (
      <View style={[styles.discountBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.discountBadgeText}>
          {badgeText}
        </Text>
      </View>
    );
  };
  
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.navigate('ProductDetailsScreen', { product })} style={styles.productCard}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ 
            uri: imageError ? 'https://via.placeholder.com/80x80?text=No+Image' : product.imageUrl,
            cache: 'force-cache'
          }} 
          style={styles.productImage}
          resizeMode="contain"
          onError={() => {
            console.log('Image loading error for:', product.name);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('Image loaded successfully for:', product.name);
          }}
        />
        {renderPromotionBadge()}
        {imageError && (
          <View style={styles.imageErrorOverlay}>
            <Text style={styles.errorText}>No Image</Text>
          </View>
        )}
      </View>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productWeight}>{product.description}</Text>
      <View style={styles.priceContainer}>
        {product.promotion && product.promotion.type === 'discount' ? (
          <>
            <Text style={styles.originalPrice}>${product.price}</Text>
            <Text style={styles.discountedPrice}>${getPromotionalPrice(product).toFixed(2)}</Text>
          </>
        ) : (
          <Text style={styles.productPrice}>${product.price}</Text>
        )}
      </View>
      {count > 0 ? (
        <View style={styles.qtyPillRow}>
          <TouchableOpacity onPress={() => onRemove(product.id)} style={styles.qtyBtnCircle}>
            <Ionicons name="remove" size={16} color="#53B175" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{count}</Text>
          <TouchableOpacity 
            onPress={() => onAdd(product.id)} 
            style={[styles.qtyBtnCircle, isAtMaxStock && styles.qtyBtnDisabled]}
            disabled={isAtMaxStock}
          >
            <Ionicons name="add" size={16} color={isAtMaxStock ? "#ccc" : "#53B175"} />
          </TouchableOpacity>
        </View>
      ) : isOutOfStock ? (
        <View style={styles.outOfStockContainer}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      ) : (
        <TouchableOpacity 
          onPress={() => onAdd(product.id)} 
          style={[styles.addButton, isAtMaxStock && styles.addButtonDisabled]}
          disabled={isAtMaxStock}
        >
          <Ionicons name="add" size={20} color={isAtMaxStock ? "#ccc" : "#fff"} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const CategoryProductsScreen = ({ navigation, route }) => {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cart, addToCart, removeFromCart, getCartCount, canAddToCart, addPromotionalProduct, setProductsData } = useCart();
  
  // Get the category from route params
  const selectedCategory = route.params?.category;
  
  const [activeCategory, setActiveCategory] = useState(selectedCategory?.id || null);
  const filterScrollViewRef = useRef(null);

  // Load categories and products on component mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Scroll to initial filter when component mounts
    if (filterScrollViewRef.current && activeCategory) {
      const filterIndex = categories.findIndex(f => f.id === activeCategory);
      if (filterIndex !== -1) {
        setTimeout(() => {
          filterScrollViewRef.current.scrollTo({
            x: filterIndex * 140,
            animated: true,
          });
        }, 500); // Delay to ensure data is loaded
      }
    }
  }, [activeCategory, categories, loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load categories
      const categoriesResult = await dataService.categories.getAll();
      if (categoriesResult.success) {
        const apiCategories = categoriesResult.data?.categories || [];
        setCategories(apiCategories);
        
        // Set active category if not set
        if (!activeCategory && selectedCategory) {
          const matchingCategory = apiCategories.find(cat => 
            cat.name.toLowerCase() === selectedCategory.name.toLowerCase()
          );
          if (matchingCategory) {
            setActiveCategory(matchingCategory.id);
          }
        }
      }
      
      // Load products
      const productsResult = await dataService.products.getAll();
      if (productsResult.success) {
        let allProducts = productsResult.data?.products || productsResult.data || [];
        allProducts = await mergeDiscountPromotions(allProducts);
        setProducts(allProducts);
        
        // Set products in cart context for ProductDetailsScreen to access
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
    // Find the product with promotional data
    const product = products.find(p => p.id.toString() === id.toString());
    if (product && product.promotion) {
      addPromotionalProduct(product);
    }
    addToCart(id);
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const handleFilterSelect = (categoryId) => {
    setActiveCategory(categoryId);
    
    // Scroll to the selected filter after a short delay to ensure state update
    setTimeout(() => {
      const filterIndex = categories.findIndex(f => f.id === categoryId);
      if (filterScrollViewRef.current && filterIndex !== -1) {
        filterScrollViewRef.current.scrollTo({
          x: filterIndex * 140, // Approximate width of each filter button with image
          animated: true,
        });
      }
    }, 100);
  };

  // Get appropriate image based on category name
  const getCategoryImage = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('meat') || name.includes('beef')) return require('../../assets/images/beef.png');
    if (name.includes('vegetable') || name.includes('carrot')) return require('../../assets/images/carror.png');
    if (name.includes('fruit') || name.includes('apple')) return require('../../assets/images/apple.png');
    if (name.includes('bread') || name.includes('bakery')) return require('../../assets/images/bread.png');
    if (name.includes('drink') || name.includes('cola')) return require('../../assets/images/cola.png');
    if (name.includes('milk') || name.includes('dairy')) return require('../../assets/images/milk.png');
    if (name.includes('snack') || name.includes('lays')) return require('../../assets/images/lays.png');
    if (name.includes('chicken')) return require('../../assets/images/chicken.png');
    if (name.includes('beer') || name.includes('alcohol')) return require('../../assets/images/beer.png');
    return require('../../assets/images/apple.png');
  };

  // Get current products based on active category
  const currentProducts = activeCategory 
    ? products.filter(product => product.categoryId === activeCategory)
    : products;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerContent}>
          {/* Top Row: Back Button, Search Bar & Cart Icon */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <View style={styles.backButtonBackground}>
                <Ionicons name="arrow-back" size={24} color="#00332A" />
              </View>
            </TouchableOpacity>
            <View style={styles.searchBarWrapperRow}>
              <Ionicons name="search" size={20} color="#B0B0B0" style={styles.searchIcon} />
              <TextInput
                style={styles.searchBarRedesigned}
                placeholder="Search for 'Grocery'"
                placeholderTextColor="#B0B0B0"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity 
              style={styles.cartIconRedesignedRow}
              onPress={() => navigation.navigate('CartScreen')}
            >
              <Ionicons name="cart-outline" size={20} color="#00332A" />
              {getCartCount() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {getCartCount() > 99 ? '99+' : getCartCount()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Filter Carousel */}
          <View style={styles.filterCarouselContainer}>
            <ScrollView 
              ref={filterScrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterCarousel}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterButton,
                    activeCategory === category.id && styles.filterButtonActive
                  ]}
                  onPress={() => handleFilterSelect(category.id)}
                >
                  <Image 
                    source={getCategoryImage(category.name)} 
                    style={styles.filterButtonImage}
                    resizeMode="contain"
                  />
                  <Text style={[
                    styles.filterButtonText,
                    activeCategory === category.id && styles.filterButtonTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <FlatList
          data={currentProducts}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              count={cart[item.id] || 0}
              onAdd={addToCart}
              onRemove={removeFromCart}
              navigation={navigation}
            />
          )}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No products found in this category</Text>
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
  headerWrapper: {
    backgroundColor: '#00332A',
    height: 160,
    paddingTop: 40,
  },
  headerContent: {
    paddingHorizontal: 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonBackground: {
    width: 38,
    height: 38,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarWrapperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 42,
    flex: 1,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBarRedesigned: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: 44,
  },
  cartIconRedesignedRow: {
    backgroundColor: '#fff',
    borderRadius: 18,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterCarouselContainer: {
    marginBottom: 20,
  },
  filterCarousel: {
    paddingHorizontal: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  filterButtonImage: {
    width: 20,
    height: 20,
  },
  filterButtonActive: {
    backgroundColor: '#53B175',
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#fff',
  },

  productsContainer: {
    padding: 12,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 5,
    width: (width - 60) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 80,
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  discountBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  errorText: {
    color: '#999',
    fontSize: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productWeight: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#53B175',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#53B175',
  },
  addButton: {
    backgroundColor: '#53B175',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  qtyPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtnCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  qtyBtnDisabled: {
    backgroundColor: '#f0f0f0',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 20,
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
  outOfStockContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});

export default CategoryProductsScreen; 