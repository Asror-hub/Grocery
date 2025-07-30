import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

import { CartProvider } from './src/context/CartContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import TabNavigator from './src/navigation/TabNavigator';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import CategoryProductsScreen from './src/screens/CategoryProductsScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import MainProductsScreen from './src/screens/MainProductsScreen';
import BoxDetailsScreen from './src/screens/BoxDetailsScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderSuccessScreen from './src/screens/OrderSuccessScreen';
import MyOrdersScreen from './src/screens/profile/MyOrdersScreen';
import ShippingAddressesScreen from './src/screens/profile/ShippingAddressesScreen';
import OrderDetailsScreen from './src/screens/profile/OrderDetailsScreen';
import IntroScreen from './src/screens/IntroScreen';
import AuthScreen from './src/screens/AuthScreen';
import LoadingScreen from './src/components/LoadingScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { loading, isAuthenticated, hasSeenIntro } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!hasSeenIntro ? (
          <>
            <Stack.Screen 
              name="Intro" 
              component={IntroScreen} 
              options={{ headerShown: false }} 
            />
          </>
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              options={{ headerShown: false }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={TabNavigator} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ProductDetailsScreen" 
              component={ProductDetailsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="CategoryProductsScreen" 
              component={CategoryProductsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Categories" 
              component={CategoriesScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="MainProductsScreen" 
              component={MainProductsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="BoxDetailsScreen" 
              component={BoxDetailsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="CartScreen" 
              component={CartScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Checkout" 
              component={CheckoutScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="OrderSuccess" 
              component={OrderSuccessScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="MyOrdersScreen" 
              component={MyOrdersScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ShippingAddressesScreen" 
              component={ShippingAddressesScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="OrderDetailsScreen" 
              component={OrderDetailsScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              options={{ headerShown: false }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar barStyle="light-content" backgroundColor="#00332A" />
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}
