import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, FlatList, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import Svg, { Ellipse } from 'react-native-svg';
import { useCart } from '../context/CartContext';
import { dataService, mergeDiscountPromotions } from '../services/dataService';

const { width } = Dimensions.get('window');

const categories = [
  { key: 'New Products', icon: 'new-releases', color: '#53B175' },
  { key: 'Promotions', icon: 'local-offer', color: '#F9B023' },
  { key: 'Our Boxes', icon: 'inventory-2', color: '#FF6B6B' },
  { key: 'Other Products', icon: 'more-horiz', color: '#9B59B6' },
];

// BoxCard component for displaying box promotions
const BoxCard = ({ boxPromotion, navigation, count, onAdd, onRemove, canAddBox }) => {
  const [imageError, setImageError] = useState(false);

  // Get box image or use first product image as fallback
  const boxImage = boxPromotion.imageUrl && !imageError
    ? { uri: boxPromotion.imageUrl }
    : (boxPromotion.products && boxPromotion.products.length > 0 && boxPromotion.products[0]?.imageUrl && !imageError
        ? { uri: boxPromotion.products[0].imageUrl }
        : require('../../assets/images/apple.png'));

  // Check if any product in the box is out of stock
  const isOutOfStock = () => {
    if (!boxPromotion.products || !Array.isArray(boxPromotion.products)) {
      return false;
    }
    
    // Check each product's stock
    for (let i = 0; i < boxPromotion.products.length; i++) {
      const product = boxPromotion.products[i];
      
      // Check if stock is 0 (out of stock)
      if (product.stockQuantity === 0) {
        return true;
      }
    }
    
    return false;
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation?.navigate('BoxDetailsScreen', { boxPromotion })} style={styles.productCard}>
      <View style={styles.imageContainer}>
        <Image 
          source={boxImage}
          style={styles.productImage}
          resizeMode="contain"
          onError={() => {
            console.log('Image loading error for:', boxPromotion.title);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('Image loaded successfully for:', boxPromotion.title);
          }}
        />
        {imageError && (
          <View style={styles.imageErrorOverlay}>
            <Text style={styles.errorText}>No Image</Text>
          </View>
        )}
      </View>
      <Text style={styles.productName}>{boxPromotion.title}</Text>
      <Text style={styles.productWeight}>{boxPromotion.description}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.productPrice}>${boxPromotion.price}</Text>
      </View>
      {isOutOfStock() ? (
        <View style={styles.outOfStockContainer}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      ) : count > 0 ? (
        <View style={styles.qtyPillRow}>
          <TouchableOpacity onPress={() => onRemove(boxPromotion.id)} style={styles.qtyBtnCircle}>
            <Ionicons name="remove" size={16} color="#53B175" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{count}</Text>
          <TouchableOpacity 
            onPress={() => canAddBox(boxPromotion.id) && onAdd(boxPromotion.id)} 
            style={[styles.qtyBtnCircle, !canAddBox(boxPromotion.id) && styles.qtyBtnDisabled]}
            disabled={!canAddBox(boxPromotion.id)}
          >
            <Ionicons name="add" size={16} color={canAddBox(boxPromotion.id) ? "#53B175" : "#ccc"} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          onPress={() => canAddBox(boxPromotion.id) && onAdd(boxPromotion.id)} 
          style={[styles.addButton, !canAddBox(boxPromotion.id) && styles.addButtonDisabled]}
          disabled={!canAddBox(boxPromotion.id)}
        >
          <Ionicons name="add" size={20} color={canAddBox(boxPromotion.id) ? "#fff" : "#ccc"} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// Move ProductCard outside of HomeScreen to prevent re-creation
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

const HomeScreen = ({ navigation }) => {
  const [newProducts, setNewProducts] = useState([]);
  const [promotionProducts, setPromotionProducts] = useState([]);
  const [boxProducts, setBoxProducts] = useState([]);
  const [otherProducts, setOtherProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState('');
  const { 
    cart, 
    boxCart, 
    addToCart, 
    removeFromCart, 
    addBoxToCart, 
    removeBoxFromCart, 
    getCartCount, 
    setProductsData, 
    setBoxesData,
    addPromotionalProduct,
    canAddBoxToCart
  } = useCart();
  const [scrollX, setScrollX] = useState(0);
  const visibleCount = 4;
  const totalCount = categories.length;
  const arcAngle = 180; // bottom half only
  const angleStep = arcAngle / (visibleCount - 1);

  useEffect(() => {
    const fetchProducts = async () => {
      const productsResult = await dataService.products.getAll();
      if (productsResult.success) {
        let allProductsData = productsResult.data?.products || productsResult.data || [];
        // Merge discount promotions
        allProductsData = await mergeDiscountPromotions(allProductsData);
        setAllProducts(allProductsData);
        setProductsData(allProductsData);

        // 1. New Products (products with isNew flag)
        const newProductsData = allProductsData.filter(p => p.isNew);
        setNewProducts(newProductsData);

        // 2. Promotion Products (products with discount or 2+1 promotions)
        const promotionProductsData = allProductsData.filter(p => 
          p.promotion && (p.promotion.type === 'discount' || p.promotion.type === '2+1')
        );
        setPromotionProducts(promotionProductsData);

        // 3. Box Products (fetch box promotions separately)
        const boxPromotionsResult = await dataService.promotions.getAll({ type: 'box', isActive: true });
        if (boxPromotionsResult.success) {
          const boxPromotionsData = boxPromotionsResult.data || [];
          setBoxProducts(boxPromotionsData);
          setBoxesData(boxPromotionsData); // Set boxes data in cart context
        } else {
          setBoxProducts([]);
          setBoxesData([]);
        }

        // 4. Other Products (6 random products from the whole list)
        // Filter out products that are new or have promotions
        const otherProductsData = allProductsData.filter(p => 
          !p.isNew && !p.promotion
        );
        // Use a stable random selection to avoid continuous re-rendering
        const shuffled = [...otherProductsData].sort(() => 0.5 - Math.random());
        const randomProducts = shuffled.slice(0, 6);
        setOtherProducts(randomProducts);
      } else {
        console.log('Error fetching products:', productsResult.error);
      }
    };
    fetchProducts();
  }, []); // Remove setProductsData from dependencies to prevent re-runs

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

  // Filter products based on search term
  const filterProducts = (productList) => {
    if (!search.trim()) return productList;
    
    const searchTerm = search.toLowerCase().trim();
    return productList.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm)) ||
      (product.category && product.category.name && product.category.name.toLowerCase().includes(searchTerm))
    );
  };

  // Get filtered products
  const filteredNewProducts = filterProducts(newProducts);
  const filteredPromotionProducts = filterProducts(promotionProducts);
  const filteredBoxProducts = filterProducts(boxProducts);
  const filteredOtherProducts = filterProducts(otherProducts);

  // Combine all filtered products for search results
  const allFilteredProducts = [
    ...filteredNewProducts,
    ...filteredPromotionProducts,
    ...filteredBoxProducts,
    ...filteredOtherProducts
  ];

  // Check if there's an active search
  const hasSearchTerm = search.trim().length > 0;



  return (
    <View style={styles.container}>
      {/* SVG Elliptical Header Background */}
      <View style={styles.headerSvgWrapper}>
        <Svg height="600" width="110%" style={styles.headerSvg}>
          <Ellipse
            cx="51%"
            cy="300"
            rx="360"
            ry="300"
            fill="#00332A"
          />
        </Svg>
        {/* Header Content */}
        <View style={styles.headerContent}>
          {/* Top Row: Search Bar, Notification Test & Cart Icon */}
          <View style={styles.headerTopRow}>
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
          {/* Location */}
          <View style={styles.locationRowRedesigned}>
            <Text style={styles.locationLabelRedesigned}>Current Location</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="location-sharp" size={16} color="#FFD700" style={{ marginRight: 4 }} />
              <Text style={styles.locationValueRedesigned}>California, USA</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Categories Row (pill style, floating over ellipse) */}
      <View style={styles.categoriesEllipseWrapper}>
        <View style={styles.categoriesEllipseContent}>
          <View style={styles.categoriesRowSimple}>
            {categories.map((cat, idx) => {
              // Upside-down arc: side pills higher, center pills lower, all overlap header
              const arcMargin = [0, 24, 24, 0][idx];
              const marginTop = -24 + arcMargin;
              return (
                <TouchableOpacity 
                  key={cat.key} 
                  style={[styles.categoryItem, { marginTop }]}
                  onPress={() => {
                    let initialFilter = 'new-products';
                    switch(cat.key) {
                      case 'New Products':
                        initialFilter = 'new-products';
                        break;
                      case 'Promotions':
                        initialFilter = 'promotions';
                        break;
                      case 'Our Boxes':
                        initialFilter = 'boxes';
                        break;
                      case 'Other Products':
                        navigation.navigate('Categories');
                        return;
                      default:
                        initialFilter = 'new-products';
                        break;
                    }
                    navigation.navigate('MainProductsScreen', { initialFilter });
                  }}
                > 
                  <View style={styles.categoryCardPill}>
                    <MaterialIcons name={cat.icon} size={32} color={cat.color} />
                  </View>
                  <Text style={styles.categoryText}>{cat.key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
      

      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {hasSearchTerm ? (
          // Search Results View
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              <Text style={styles.searchResultsCount}>{allFilteredProducts.length} products found</Text>
            </View>
            <FlatList
              data={allFilteredProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              style={{ marginLeft: 10, marginBottom: 8, paddingVertical: 5 }}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  count={cart[item.id]}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  navigation={navigation}
                />
              )}
              ListEmptyComponent={
                <View style={styles.noSearchResultsContainer}>
                  <Text style={styles.noSearchResultsText}>No products found matching "{search}"</Text>
                </View>
              }
            />
          </>
        ) : (
          // Normal Category Sections View
          <>
            {/* New Products */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>New Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MainProductsScreen', { initialFilter: 'new-products' })}>
                <Text style={styles.seeMore}>See more</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredNewProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              style={{ marginLeft: 10, marginBottom: 8, paddingVertical: 5 }}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  count={cart[item.id]}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  navigation={navigation}
                />
              )}
              ListEmptyComponent={<Text style={{marginLeft: 16, color: '#888'}}>No new products found.</Text>}
            />

            {/* Promotions */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Promotions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MainProductsScreen', { initialFilter: 'promotions' })}>
                <Text style={styles.seeMore}>See more</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredPromotionProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              style={{ marginLeft: 10, marginBottom: 8, paddingVertical: 5 }}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  count={cart[item.id]}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  navigation={navigation}
                />
              )}
              ListEmptyComponent={<Text style={{marginLeft: 16, color: '#888'}}>No promotions found.</Text>}
            />

            {/* Our Boxes */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Our Boxes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MainProductsScreen', { initialFilter: 'boxes' })}>
                <Text style={styles.seeMore}>See more</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredBoxProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              style={{ marginLeft: 10, marginBottom: 8, paddingVertical: 5 }}
              renderItem={({ item }) => (
                <BoxCard
                  boxPromotion={item}
                  navigation={navigation}
                  count={boxCart[item.id]}
                  onAdd={addBoxToCart}
                  onRemove={removeBoxFromCart}
                  canAddBox={canAddBoxToCart}
                />
              )}
              ListEmptyComponent={<Text style={{marginLeft: 16, color: '#888'}}>No boxes found.</Text>}
            />

            {/* Other Products */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Other Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MainProductsScreen', { initialFilter: 'other-products' })}>
                <Text style={styles.seeMore}>See more</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredOtherProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              style={{ marginLeft: 10, marginBottom: 8, paddingVertical: 5 }}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  count={cart[item.id]}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  navigation={navigation}
                />
              )}
              ListEmptyComponent={<Text style={{marginLeft: 16, color: '#888'}}>No other products found.</Text>}
            />
          </>
        )}
        
        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F8' },
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  headerRedesigned: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
    backgroundColor: '#00332A',
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    position: 'relative',
    minHeight: 170,
  },
  cartIconRedesigned: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 38,
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
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
  locationRowRedesigned: {
    marginTop: 38,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  locationLabelRedesigned: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  locationValueRedesigned: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 15,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  categoryText: {
    marginTop: 4,
    color: '#00332A',
    fontWeight: '600',
    fontSize: 10,
    textAlign: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: 24,
    marginTop: -36, // Overlap with header ellipse
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center', marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontWeight: 'bold', fontSize: 18, color: '#00332A' },
  seeMore: { color: '#F9B023', fontWeight: 'bold' },
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
  imageLoading: {
    opacity: 0.3,
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
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
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#53B175',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtn: {
    backgroundColor: '#F7F9F8',
    borderRadius: 16,
    padding: 6,
    marginHorizontal: 8,
  },

  deliveryRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  deliveryCard: { backgroundColor: '#E6F7F1', borderRadius: 16, padding: 16, alignItems: 'center', width: 150 },
  deliveryTitle: { fontWeight: 'bold', color: '#00332A', fontSize: 16 },
  deliveryTime: { color: '#888', fontSize: 13, marginVertical: 2 },
  deliveryFree: { color: '#F9B023', fontWeight: 'bold', fontSize: 13 },

  headerSvgWrapper: {
    position: 'relative',
    width: '100%',
    height: 250, // Show only bottom half
    marginBottom: 36,
    overflow: 'hidden',
  },
  headerSvg: {
    position: 'absolute',
    top: -350, // Shift up to show only bottom half
    left: '-5%', // Center the SVG for 110% width
    width: '110%',
    height: 600,
    zIndex: 0,
  },
  headerContent: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 1,
    paddingTop: 8, // Reduced for flush top
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
    // marginTop: 12, // Remove to pull up
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
  cartIconRedesignedRow: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationTestButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testNotificationContainer: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  testNotificationButton: {
    backgroundColor: '#53B175',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testNotificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoriesEllipseWrapper: {
    position: 'relative',
    width: '100%',
    height: 60,
    marginTop: -68, // Pull up closer to header
    marginBottom: 35,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  categoriesEllipseSvg: {
    position: 'absolute',
    top: -60, // Show only the top half
    left: 0,
    width: '100%',
    height: 120,
    zIndex: 0,
  },
  categoriesEllipseContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  categoryIconPill: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 8,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardPill: {
    backgroundColor: '#fff',
    borderRadius: 40,
    width: 73,
    height: 73,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesRowSimple: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'center',
    width: 'auto',
  },
  arcCarouselWrapper: {
    width: '100%',
    height: 120,
    marginTop: -36,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'rgba(255,0,0,0.1)', // DEBUG: remove after
  },
  categoryItemArcCarousel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardPillArcCarousel: {
    backgroundColor: '#fff',
    borderRadius: 40,
    width: 73,
    height: 73,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#53B175',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  productActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  actionBtnCircle: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addToCartBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#53B175',
    borderRadius: 32,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingVertical: 12,
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  productActionsRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
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
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
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
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  searchResultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  noSearchResultsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSearchResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen; 