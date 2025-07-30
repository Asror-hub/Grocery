// API Configuration
export const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://192.168.1.30:5000/api',
    timeout: 10000,
  },
  
  // Production
  production: {
    baseURL: 'https://your-production-api.com/api', // Change this to your production API URL
    timeout: 15000,
  },
  
  // Staging
  staging: {
    baseURL: 'https://your-staging-api.com/api', // Change this to your staging API URL
    timeout: 12000,
  },
};

// Get current environment
const getEnvironment = () => {
  // You can change this based on your build process
  if (__DEV__) {
    return 'development';
  }
  // Add logic to detect staging/production
  return 'development';
};

// Export current config
export const getApiConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env];
};

// For local development with different backend ports
export const LOCAL_API_CONFIG = {
  // If your backend runs on a different port, change this
  baseURL: 'http://192.168.1.30:5000/api',
  timeout: 10000,
};

export default getApiConfig; 