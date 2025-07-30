import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, FlatList, ActivityIndicator, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { dataService } from '../services/dataService';

const BoxCard = ({ boxPromotion, navigation, count, onAdd, onRemove, canAddBox }) => {
  const [imageError, setImageError] = useState(false);
  
  // Use box thumbnail image if available, otherwise use first product image, or default
  const boxImage = boxPromotion.imageUrl && !imageError 
    ? { uri: boxPromotion.imageUrl } 
    : (boxPromotion.products && boxPromotion.products.length > 0 && boxPromotion.products[0]?.imageUrl && !imageError 
        ? { uri: boxPromotion.products[0].imageUrl } 
        : require('../../assets/images/apple.png'));
  
  const calculateIndividualTotal = () => {
    if (!boxPromotion.products || !Array.isArray(boxPromotion.products)) return 0;
    return boxPromotion.products.reduce((total, product) => {
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
    <TouchableOpacity 
      activeOpacity={0.85} 
      onPress={() => navigation?.navigate('BoxDetailsScreen', { boxPromotion })}
      style={styles.productCard}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={boxImage}
          style={styles.productImage}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />
        <View style={styles.boxBadge}>
          <Text style={styles.boxBadgeText}>BOX</Text>
        </View>
        {imageError && (
          <View style={styles.imageErrorOverlay}>
            <Text style={styles.errorText}>No Image</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.productName}>{boxPromotion.title}</Text>
      <Text style={styles.productWeight}>{boxPromotion.description}</Text>
      
      <View style={styles.priceContainer}>
        <Text style={styles.originalPrice}>${calculateIndividualTotal().toFixed(2)}</Text>
        <Text style={styles.discountedPrice}>${boxPromotion.price}</Text>
      </View>
      
      {/* Show Out of Stock if any product in box is out of stock */}
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

const OurBoxesScreen = ({ navigation }) => {
  const [boxPromotions, setBoxPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const { 
    boxCart, 
    addBoxToCart, 
    removeBoxFromCart, 
    getCartCount, 
    setBoxesData,
    addPromotionalProduct,
    canAddBoxToCart
  } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all products first to get stock information
      const productsResult = await dataService.products.getAll();
      if (!productsResult.success) {
        console.error('Products error:', productsResult.error);
        setError('Failed to load products');
        return;
      }
      
      const allProducts = productsResult.data?.products || productsResult.data || [];
      
      // Fetch box-type promotions from backend
      const promotionsResult = await dataService.promotions.getAll({ type: 'box', isActive: true });
      if (promotionsResult.success) {
        const promotions = promotionsResult.data || [];
        
        // Merge products with box promotions to get stock information
        const enrichedPromotions = promotions.map(promotion => {
          if (promotion.products && Array.isArray(promotion.products)) {
            const enrichedProducts = promotion.products.map(boxProduct => {
              // Find the full product data with stock information
              const fullProduct = allProducts.find(p => p.id.toString() === boxProduct.id.toString());
              
              return {
                ...boxProduct,
                ...fullProduct, // This will include stockQuantity and other fields
              };
            });
            
            return {
              ...promotion,
              products: enrichedProducts
            };
          }
          return promotion;
        });
        
        // Store the enriched box promotions
        setBoxPromotions(enrichedPromotions);
        
        // Add all products from box promotions to cart context
        enrichedPromotions.forEach(promotion => {
          if (promotion.products && Array.isArray(promotion.products)) {
            promotion.products.forEach(product => {
              const productWithPromotion = {
                ...product,
                promotion: {
                  id: promotion.id,
                  title: promotion.title,
                  type: promotion.type,
                  price: promotion.price,
                  description: promotion.description
                }
              };
              addPromotionalProduct(productWithPromotion);
            });
          }
        });
      } else {
        console.error('Box promotions error:', promotionsResult.error);
        setError('Failed to load box promotions');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (id) => {
    addBoxToCart(id);
  };

  const handleRemove = (id) => {
    removeBoxFromCart(id);
  };

  // Filter box promotions based on search
  const filteredBoxPromotions = boxPromotions.filter(box =>
    box.title.toLowerCase().includes(search.toLowerCase()) ||
    box.description?.toLowerCase().includes(search.toLowerCase()) ||
    box.products?.some(product => 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase())
    )
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
        <Text style={styles.headerTitle}>Our Boxes</Text>
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
            placeholder="Search boxes..."
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
          <Text style={styles.loadingText}>Loading boxes...</Text>
        </View>
      )}

      {/* Boxes Grid */}
      {!loading && !error && (
        <FlatList
          data={filteredBoxPromotions}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <BoxCard
              boxPromotion={item}
              navigation={navigation}
              count={boxCart[item.id]}
              onAdd={handleAdd}
              onRemove={handleRemove}
              canAddBox={canAddBoxToCart}
            />
          )}
          contentContainerStyle={styles.boxesContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No boxes found</Text>
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
  // Product card styles (matching HomeScreen)
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    margin: 6,
    width: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00332A',
    textAlign: 'center',
    marginBottom: 4,
  },
  productWeight: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#53B175',
  },
  addButton: {
    backgroundColor: '#53B175',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9F0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  qtyBtnCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#53B175',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00332A',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  boxBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  boxBadgeText: {
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  errorText: {
    color: '#999',
    fontSize: 12,
  },
  outOfStockContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#999',
    fontSize: 12,
    fontWeight: 'bold',
  },
  qtyBtnDisabled: {
    borderColor: '#ccc',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
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
  boxesContainer: {
    padding: 12,
  },
  boxCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 14,
    margin: 6,
    marginBottom: 8,
    flex: 1,
    maxWidth: '48%',
    height: 220,
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
    alignItems: 'center',
  },
  boxImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  boxBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 30,
  },
  boxBadgeText: {
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
  boxPrice: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  savingsText: {
    fontSize: 11,
    color: '#53B175',
    fontWeight: '600',
    textAlign: 'center',
  },
  boxInfo: {
    alignItems: 'center',
  },
  boxTitle: {
    fontWeight: 'bold',
    color: '#00332A',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  boxDescription: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  itemCount: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
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

export default OurBoxesScreen; 