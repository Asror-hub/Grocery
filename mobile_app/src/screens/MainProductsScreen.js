import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, FlatList, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { dataService, mergeDiscountPromotions } from '../services/dataService';

const { width } = Dimensions.get('window');

const filters = [
  { key: 'new-products', title: 'New Products', icon: 'new-releases', color: '#53B175' },
  { key: 'promotions', title: 'Promotions', icon: 'local-offer', color: '#F9B023' },
  { key: 'boxes', title: 'Our Boxes', icon: 'inventory-2', color: '#FF6B6B' },
  { key: 'summer-offer', title: 'Summer Offer', icon: 'wb-sunny', color: '#4ECDC4' },
];

// ProductCard component (same as HomeScreen)
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

// BoxCard component for box promotions
const BoxCard = ({ boxPromotion, navigation }) => {
  const [imageError, setImageError] = useState(false);

  // Use box thumbnail image if available, otherwise use first product image, or default
  const boxImage = boxPromotion.imageUrl && !imageError
    ? { uri: boxPromotion.imageUrl }
    : (boxPromotion.products && boxPromotion.products.length > 0 && boxPromotion.products[0]?.imageUrl && !imageError
        ? { uri: boxPromotion.products[0].imageUrl }
        : require('../../assets/images/apple.png'));

  return (
    <TouchableOpacity 
      style={styles.boxCard} 
      onPress={() => navigation.navigate('BoxDetailsScreen', { boxPromotion })}
    >
      <View style={styles.boxImageContainer}>
        <Image
          source={boxImage}
          style={styles.boxImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </View>
      <View style={styles.boxContent}>
        <Text style={styles.boxTitle}>{boxPromotion.title}</Text>
        <Text style={styles.boxDescription}>{boxPromotion.description}</Text>
        <Text style={styles.boxPrice}>${boxPromotion.price}</Text>
        <Text style={styles.boxProductsCount}>
          {boxPromotion.products?.length || 0} products
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const MainProductsScreen = ({ navigation, route }) => {
  const initialFilter = route.params?.initialFilter || 'new-products';
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [boxPromotions, setBoxPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { cart, addToCart, removeFromCart, getCartCount, setProductsData, addPromotionalProduct } = useCart();
  const filterScrollViewRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Scroll to initial filter when component mounts
    if (filterScrollViewRef.current) {
      const filterIndex = filters.findIndex(f => f.key === selectedFilter);
      if (filterIndex !== -1) {
        setTimeout(() => {
          filterScrollViewRef.current.scrollTo({
            x: filterIndex * 120,
            animated: true,
          });
        }, 500); // Delay to ensure data is loaded
      }
    }
  }, [selectedFilter, loading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all products
      const productsResult = await dataService.products.getAll();
      if (productsResult.success) {
        let allProductsData = productsResult.data?.products || productsResult.data || [];
        allProductsData = await mergeDiscountPromotions(allProductsData);
        setProductsData(allProductsData);
        setAllProducts(allProductsData);

        // Filter new products
        const newProducts = allProductsData.filter(p => p.isNew);
        setProducts(newProducts);

        // Fetch promotions
        const promotionsResult = await dataService.promotions.getAll();
        if (promotionsResult.success) {
          const allPromotions = promotionsResult.data || [];
          
          // Filter discount and 2+1 promotions
          const discountPromotions = allPromotions.filter(p => 
            p.type === 'discount' || p.type === '2+1'
          );
          setPromotions(discountPromotions);

          // Filter box promotions
          const boxes = allPromotions.filter(p => p.type === 'box');
          setBoxPromotions(boxes);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (id) => {
    // Find the product with promotional data
    const product = allProducts.find(p => p.id.toString() === id.toString());
    if (product && product.promotion) {
      addPromotionalProduct(product);
    }
    addToCart(id);
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const handleFilterSelect = (filterKey) => {
    setSelectedFilter(filterKey);
    
    // Scroll to the selected filter after a short delay to ensure state update
    setTimeout(() => {
      const filterIndex = filters.findIndex(f => f.key === filterKey);
      if (filterScrollViewRef.current && filterIndex !== -1) {
        filterScrollViewRef.current.scrollTo({
          x: filterIndex * 120, // Approximate width of each filter button
          animated: true,
        });
      }
    }, 100);
  };

  // Filter data based on search term
  const filterData = (data) => {
    if (!search.trim()) return data;
    
    const searchTerm = search.toLowerCase().trim();
    return data.filter(item => {
      if (selectedFilter === 'boxes') {
        // For box promotions, search in title and description
        return item.title.toLowerCase().includes(searchTerm) ||
               (item.description && item.description.toLowerCase().includes(searchTerm));
      } else {
        // For products, search in name, description, and category
        return item.name.toLowerCase().includes(searchTerm) ||
               (item.description && item.description.toLowerCase().includes(searchTerm)) ||
               (item.category && item.category.name && item.category.name.toLowerCase().includes(searchTerm));
      }
    });
  };

  const getCurrentData = () => {
    let data;
    switch (selectedFilter) {
      case 'new-products':
        data = products;
        break;
      case 'promotions':
        // Get products that have promotions (discount or 2+1)
        data = allProducts.filter(product => product.promotion && (product.promotion.type === 'discount' || product.promotion.type === '2+1'));
        break;
      case 'boxes':
        data = boxPromotions;
        break;
      case 'summer-offer':
        // Get products that have promotions (discount or 2+1) - same as promotions
        data = allProducts.filter(product => product.promotion && (product.promotion.type === 'discount' || product.promotion.type === '2+1'));
        break;
      default:
        data = [];
    }
    
    return filterData(data);
  };

  const getCurrentTitle = () => {
    const filter = filters.find(f => f.key === selectedFilter);
    return filter ? filter.title : '';
  };

  const renderItem = ({ item }) => {
    if (selectedFilter === 'boxes') {
      return <BoxCard boxPromotion={item} navigation={navigation} />;
    } else {
      // For all other filters, item is a product
      return (
        <ProductCard
          product={item}
          count={cart[item.id]}
          onAdd={handleAdd}
          onRemove={handleRemove}
          navigation={navigation}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Normal Header Background */}
      <View style={styles.headerWrapper}>
        {/* Header Content */}
        <View style={styles.headerContent}>
          {/* Top Row: Back Button, Search Bar & Cart Icon */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#00332A" />
            </TouchableOpacity>
            <View style={styles.searchBarWrapperRow}>
              <Ionicons name="search" size={20} color="#B0B0B0" style={styles.searchIcon} />
              <TextInput
                style={styles.searchBarRedesigned}
                placeholder="Search products..."
                placeholderTextColor="#B0B0B0"
                value={search}
                onChangeText={setSearch}
              />
            </View>
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

          {/* Filter Carousel */}
          <View style={styles.filterCarouselContainer}>
            <ScrollView 
              ref={filterScrollViewRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterCarousel}
            >
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter.key && styles.filterButtonActive
                  ]}
                  onPress={() => handleFilterSelect(filter.key)}
                >
                  <MaterialIcons 
                    name={filter.icon} 
                    size={16} 
                    color={selectedFilter === filter.key ? '#fff' : filter.color} 
                  />
                  <Text style={[
                    styles.filterButtonText,
                    selectedFilter === filter.key && styles.filterButtonTextActive
                  ]}>
                    {filter.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{getCurrentTitle()}</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={getCurrentData()}
            numColumns={selectedFilter === 'boxes' ? 2 : 3}
            key={selectedFilter === 'boxes' ? '2-columns' : '3-columns'}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            style={styles.productsGrid}
            contentContainerStyle={styles.productsGridContent}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No {getCurrentTitle().toLowerCase()} found.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
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
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 10,
  },
  searchBarWrapperRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 15,
    height: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBarRedesigned: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  cartIconRedesignedRow: {
    backgroundColor: '#fff',
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    minWidth: 20,
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
    marginTop: 10,
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
  contentContainer: {
    flex: 1,
    marginTop: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  productsGrid: {
    flex: 1,
  },
  productsGridContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  // ProductCard styles
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
  // BoxCard styles
  boxCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 5,
    width: (width - 40) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  boxImageContainer: {
    width: '100%',
    height: 120,
  },
  boxImage: {
    width: '100%',
    height: '100%',
  },
  boxContent: {
    padding: 12,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  boxDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  boxPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#53B175',
    marginBottom: 4,
  },
  boxProductsCount: {
    fontSize: 12,
    color: '#999',
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

export default MainProductsScreen; 