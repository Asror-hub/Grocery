# 🛒 Grocery App - Complete E-commerce Solution

A full-stack grocery e-commerce application with admin panel, mobile app, and backend API.

## 📱 Project Overview

This is a comprehensive grocery shopping application that consists of three main components:

- **📱 Mobile App** - React Native application for customers
- **🖥️ Admin Panel** - React TypeScript web application for store management
- **🔧 Backend API** - Node.js/Express.js REST API with TypeScript

## ✨ Features

### Mobile App Features
- User authentication (login/register)
- Product browsing by categories
- Shopping cart functionality
- Order placement and tracking
- Payment methods management
- Shipping addresses
- Promotions and special offers
- Product recommendations
- Order history

### Admin Panel Features
- Dashboard with sales analytics
- Product management (CRUD operations)
- Category management
- Order management and status updates
- User management
- Promotion management
- Settings configuration
- Sales reports and charts

### Backend API Features
- RESTful API endpoints
- JWT authentication
- File upload support
- Database migrations
- Real-time notifications
- Payment processing
- Order management
- User management

## 🛠️ Technology Stack

### Mobile App
- **React Native** - Cross-platform mobile development
- **React Navigation** - Navigation between screens
- **Context API** - State management
- **Axios** - HTTP client for API calls

### Admin Panel
- **React** - Frontend framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Material-UI** - UI components
- **Chart.js** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Sequelize** - ORM for database
- **MySQL** - Database
- **JWT** - Authentication
- **Multer** - File upload handling
- **Socket.io** - Real-time communication

## 📁 Project Structure

```
Grocery_2/
├── admin-app/          # React TypeScript admin panel
├── backend/            # Node.js/Express.js API
├── mobile_app/         # React Native mobile app
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MySQL database
- React Native development environment (for mobile app)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure database:
   - Create a MySQL database
   - Update database configuration in `src/config/database.ts`
   - Set up environment variables in `.env` file

4. Run migrations:
```bash
npm run migrate
```

5. Start the server:
```bash
npm run dev
```

### Admin Panel Setup

1. Navigate to the admin-app directory:
```bash
cd admin-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint in `src/config/index.ts`

4. Start the development server:
```bash
npm start
```

### Mobile App Setup

1. Navigate to the mobile_app directory:
```bash
cd mobile_app
```

2. Install dependencies:
```bash
npm install
```

3. For iOS (requires macOS):
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

4. For Android:
```bash
npx react-native run-android
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_NAME=grocery_db
JWT_SECRET=your_jwt_secret
PORT=3000
```

### API Configuration

Update the API base URL in both admin panel and mobile app configuration files to match your backend server.

## 📊 Database Schema

The application uses MySQL with the following main tables:
- Users
- Products
- Categories
- Orders
- OrderItems
- Promotions
- Settings

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Customer authentication for mobile app
- Admin authentication for admin panel
- Role-based access control

## 📱 Mobile App Screenshots

[Add screenshots here when available]

## 🖥️ Admin Panel Screenshots

[Add screenshots here when available]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Asror** - [GitHub Profile](https://github.com/Asror-hub)

## 🙏 Acknowledgments

- React Native community
- React ecosystem
- Node.js community
- All contributors and supporters

---

**Note**: Make sure to update the API endpoints and configuration files according to your deployment environment. 