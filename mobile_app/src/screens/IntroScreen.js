import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const IntroScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const { markIntroAsSeen } = useAuth();

  const introData = [
    {
      id: '1',
      title: 'Fresh Groceries Delivered',
      subtitle: 'Get fresh, high-quality groceries delivered right to your doorstep',
      image: require('../../assets/images/apple.png'),
      icon: 'leaf-outline',
    },
    {
      id: '2',
      title: 'Easy Shopping Experience',
      subtitle: 'Browse thousands of products, compare prices, and order with just a few taps',
      image: require('../../assets/images/milk.png'),
      icon: 'cart-outline',
    },
    {
      id: '3',
      title: 'Fast & Reliable Delivery',
      subtitle: 'Same-day delivery available. Track your order in real-time',
      image: require('../../assets/images/bread.png'),
      icon: 'time-outline',
    },
  ];

  const renderItem = ({ item, index }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={40} color="#53B175" />
        </View>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const handleNext = async () => {
    console.log('🔍 IntroScreen: Next button pressed, currentIndex:', currentIndex);
    if (currentIndex < introData.length - 1) {
      console.log('🔍 IntroScreen: Scrolling to next slide');
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      console.log('🔍 IntroScreen: Last slide reached, marking intro as seen');
      await markIntroAsSeen();
      console.log('🔍 IntroScreen: Intro marked as seen, navigation should happen automatically');
      // Navigation is handled automatically by App.js based on auth state
    }
  };

  const handleSkip = async () => {
    console.log('🔍 IntroScreen: Skip button pressed');
    await markIntroAsSeen();
    console.log('🔍 IntroScreen: Intro marked as seen via skip, navigation should happen automatically');
    // Navigation is handled automatically by App.js based on auth state
  };

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {introData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>



      {/* Intro Slides */}
      <FlatList
        ref={flatListRef}
        data={introData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={styles.flatList}
      />

      {/* Dots Indicator */}
      {renderDots()}

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === introData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons 
            name={currentIndex === introData.length - 1 ? "arrow-forward" : "chevron-forward"} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#53B17520',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  image: {
    width: 200,
    height: 200,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00332A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#53B175',
    width: 24,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#53B175',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#53B175',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default IntroScreen; 