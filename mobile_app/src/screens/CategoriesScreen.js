import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Ellipse } from 'react-native-svg';
import { useCart } from '../context/CartContext';
import { dataService } from '../services/dataService';

// Default categories as fallback
const defaultCategories = [
  {
    id: '1',
    name: 'Meats',
    description: 'Frozen Meal',
    icon: 'restaurant',
    color: '#E6F7F1',
    image: require('../../assets/images/beef.png'),
  },
  {
    id: '2',
    name: 'Vegetables',
    description: 'Markets',
    icon: 'eco',
    color: '#E6F7F1',
    image: require('../../assets/images/carror.png'),
  },
  {
    id: '3',
    name: 'Fruits',
    description: 'Comical free',
    icon: 'local-grocery-store',
    color: '#E6F7F1',
    image: require('../../assets/images/apple.png'),
  },
  {
    id: '4',
    name: 'Breads',
    description: 'Burnt',
    icon: 'bakery-dining',
    color: '#E6F7F1',
    image: require('../../assets/images/bread.png'),
  },
];

const CategoryCard = ({ category, onPress }) => {
  // Get appropriate icon based on category name
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('meat') || name.includes('beef') || name.includes('chicken')) return 'restaurant';
    if (name.includes('vegetable') || name.includes('carrot')) return 'eco';
    if (name.includes('fruit') || name.includes('apple')) return 'local-grocery-store';
    if (name.includes('bread') || name.includes('bakery')) return 'bakery-dining';
    if (name.includes('drink') || name.includes('cola') || name.includes('beer')) return 'local-cafe';
    if (name.includes('milk') || name.includes('dairy')) return 'local-dining';
    if (name.includes('snack') || name.includes('lays')) return 'local-cafe';
    if (name.includes('alcohol') || name.includes('alkohol')) return 'wine-bar';
    return 'category';
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

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress}>
      <View style={styles.categoryContent}>
        <View style={styles.categoryTextContainer}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>
            {category.description || `${category.products?.length || 0} products`}
          </Text>
        </View>
        <View style={styles.categoryImageContainer}>
          <Image source={getCategoryImage(category.name)} style={styles.categoryImage} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CategoriesScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getCartCount } = useCart();

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dataService.categories.getAll();
      if (result.success) {
        setCategories(result.data?.categories || []);
      } else {
        console.error('Categories error:', result.error);
        setCategories(defaultCategories); // Use default categories as fallback
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
      setCategories(defaultCategories); // Use default categories as fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryProductsScreen', { category });
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => {
    if (!search.trim()) return true;
    
    const searchTerm = search.toLowerCase().trim();
    return category.name.toLowerCase().includes(searchTerm) ||
           (category.description && category.description.toLowerCase().includes(searchTerm));
  });

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
          {/* Top Row: Search Bar & Cart Icon */}
          <View style={styles.headerTopRow}>
            <View style={styles.searchBarWrapperRow}>
              <Ionicons name="search" size={20} color="#B0B0B0" style={styles.searchIcon} />
              <TextInput
                style={styles.searchBarRedesigned}
                placeholder="Search categories..."
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
          
          {/* All Categories Title */}
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>All Categories</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#53B175" />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesGrid}>
            {(filteredCategories || []).map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => handleCategoryPress(category)}
              />
            ))}
          </View>
        </View>

        {/* Show message when no categories */}
        {!loading && !error && (categories || []).length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No categories found</Text>
          </View>
        )}

        {/* Show message when search returns no results */}
        {!loading && !error && search.trim() && filteredCategories.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No categories found matching "{search}"</Text>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  headerSvgWrapper: {
    position: 'relative',
    width: '100%',
    height: 220,
    marginBottom: 0,
    overflow: 'hidden',
    marginTop: -40,
    backgroundColor: 'transparent',
  },
  headerSvg: {
    position: 'absolute',
    top: -380,
    left: '-5%',
    width: '110%',
    height: 600,
    zIndex: 0,
  },
  headerContent: {
    position: 'absolute',
    top: 100,
    left: 0,
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 1,
    paddingTop: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
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
  headerTitleRow: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  scrollView: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00332A',
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingRight: 8,
    marginLeft: -4,
  },
  categoryTextContainer: {
    flex: 1,
    marginRight: -20,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00332A',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
  },
  categoryImageContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: -15,
  },
  categoryImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
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

export default CategoriesScreen; 