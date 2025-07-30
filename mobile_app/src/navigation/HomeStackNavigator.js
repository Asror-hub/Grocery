import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import MainProductsScreen from '../screens/MainProductsScreen';
import NewProductsScreen from '../screens/NewProductsScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import OurBoxesScreen from '../screens/OurBoxesScreen';
import SummerOfferScreen from '../screens/SummerOfferScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import BoxDetailsScreen from '../screens/BoxDetailsScreen';

const Stack = createStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="MainProductsScreen" component={MainProductsScreen} />
      <Stack.Screen name="NewProductsScreen" component={NewProductsScreen} />
      <Stack.Screen name="PromotionsScreen" component={PromotionsScreen} />
      <Stack.Screen name="OurBoxesScreen" component={OurBoxesScreen} />
      <Stack.Screen name="SummerOfferScreen" component={SummerOfferScreen} />
      <Stack.Screen name="ProductDetailsScreen" component={ProductDetailsScreen} />
      <Stack.Screen name="BoxDetailsScreen" component={BoxDetailsScreen} />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator; 