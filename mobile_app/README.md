# Grocery Mobile App

A React Native mobile application for grocery shopping with backend API integration.

## Features

- 🛒 Product browsing and search
- 📱 Category-based product organization
- 🛍️ Shopping cart functionality
- 👤 User authentication
- 📦 Order management
- 🔔 Notifications
- 🎯 Promotions and deals
- 📍 Location-based services

## Project Structure

```
mobile_app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── context/            # React Context providers
│   │   ├── AuthContext.js  # Authentication state management
│   │   └── CartContext.js  # Shopping cart state management
│   ├── navigation/         # Navigation configuration
│   ├── screens/           # App screens
│   ├── services/          # API and data services
│   │   ├── api.js         # API service layer
│   │   └── dataService.js # Business logic layer
│   └── config/            # Configuration files
│       └── apiConfig.js   # API configuration
├── assets/                # Images and static assets
└── App.js                 # Main app component
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- React Native development environment

## Installation

1. **Install dependencies:**
   ```bash
   cd mobile_app
   npm install
   ```

2. **Install Expo CLI globally (if not already installed):**
   ```bash
   npm install -g @expo/cli
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

## API Integration

The mobile app is connected to a backend API with the following endpoints:

### Authentication
- `POST /api/customer/auth/register` - User registration
- `POST /api/customer/auth/login` - User login
- `POST /api/customer/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products?categoryId=:id` - Get products by category
- `GET /api/products?search=:query` - Search products

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `POST /api/orders/:id/cancel` - Cancel order

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Promotions
- `GET /api/promotions` - Get active promotions

## Configuration

### API Configuration

Edit `src/config/apiConfig.js` to configure API endpoints:

```javascript
export const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
  },
  production: {
    baseURL: 'https://your-production-api.com/api',
    timeout: 15000,
  },
};
```

### Environment Setup

1. **Development:** Uses localhost API
2. **Production:** Update the production URL in `apiConfig.js`
3. **Staging:** Add staging configuration as needed

## Backend Requirements

Make sure your backend is running and accessible at the configured URL. The backend should provide:

- RESTful API endpoints
- JWT authentication
- CORS enabled
- Proper error handling
- Database connectivity

## Running the App

### Development
```bash
npm start
```

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Web
```bash
npm run web
```

## Key Features Implementation

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure token storage using AsyncStorage
- Login/logout functionality

### Product Management
- Dynamic product loading from API
- Category-based filtering
- Search functionality
- Product details view

### Shopping Cart
- Add/remove products
- Quantity management
- Persistent cart state
- Cart total calculation

### Error Handling
- Network error handling
- API error responses
- User-friendly error messages
- Retry mechanisms

## Dependencies

### Core Dependencies
- `react-native`: Core React Native framework
- `expo`: Development platform
- `@react-navigation/native`: Navigation
- `@react-navigation/stack`: Stack navigation
- `@react-navigation/bottom-tabs`: Tab navigation

### API & Data
- `axios`: HTTP client for API calls
- `@react-native-async-storage/async-storage`: Local storage

### UI & Icons
- `react-native-svg`: SVG support
- `react-native-vector-icons`: Icon library
- `styled-components`: Styling

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend is running
   - Verify API URL in `apiConfig.js`
   - Check network connectivity

2. **Authentication Issues**
   - Clear AsyncStorage
   - Check JWT token validity
   - Verify API endpoints

3. **Build Errors**
   - Clear node_modules and reinstall
   - Reset Expo cache: `expo r -c`
   - Check React Native version compatibility

### Development Tips

1. **API Testing**
   - Use tools like Postman to test API endpoints
   - Check browser developer tools for network requests
   - Monitor console logs for API responses

2. **State Management**
   - Use React Context for global state
   - Implement proper error boundaries
   - Handle loading states appropriately

3. **Performance**
   - Implement proper list virtualization
   - Optimize image loading
   - Use React.memo for expensive components

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include loading states
4. Test API integration
5. Update documentation

## License

This project is licensed under the MIT License. 