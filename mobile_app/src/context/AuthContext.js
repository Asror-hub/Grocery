import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataService } from '../services/dataService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  useEffect(() => {
    loadUser();
    checkIntroStatus().catch(error => {
      console.error('Error checking intro status:', error);
    });
  }, []);



  const loadUser = async () => {
    try {
      const isAuthenticated = await dataService.auth.isAuthenticated();
      
      if (isAuthenticated) {
        const userData = await dataService.auth.getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIntroStatus = async () => {
    try {
      const introSeen = await AsyncStorage.getItem('hasSeenIntro');
      setHasSeenIntro(introSeen === 'true');
    } catch (error) {
      console.error('Error checking intro status:', error);
      setHasSeenIntro(false);
    }
  };

  const markIntroAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntro', 'true');
      setHasSeenIntro(true);
    } catch (error) {
      console.error('Error marking intro as seen:', error);
    }
  };





  const login = async (email, password) => {
    try {
      console.log('🔍 AuthContext: Login started');
      const result = await dataService.auth.login(email, password);
      
      if (result.success) {
        console.log('🔍 AuthContext: Login successful, setting user:', result.data);
        setUser(result.data);
        
        console.log('🔍 AuthContext: Login completed, user should be authenticated now');
        return { success: true };
      } else {
        console.log('🔍 AuthContext: Login failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await dataService.auth.register(userData);
      if (result.success) {
        setUser(result.data);
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  };

    const logout = async () => {
    try {
      await dataService.auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    hasSeenIntro,
    login,
    register,
    logout,
    markIntroAsSeen,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 