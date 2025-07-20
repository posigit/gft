# Presken Guest Feedback Tracker (GFT) - Backend

This is the backend API for the Presken Guest Feedback Tracker system, a comprehensive feedback management system for hotel chains.

## Features

- JWT Authentication with refresh tokens
- Role-based access control (SUPER_ADMIN, HOTEL_ADMIN)
- MongoDB database integration
- Guest feedback submission and management
- Hotel and user management
- Analytics and reporting
- QR Code generation for each hotel

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Zod for validation
- Express Rate Limit for security

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```
   cd server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the server directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   NODE_ENV=development
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

### Seeding the Database

To create an initial Super Admin user, hotels, and categories:
```
npm run seed
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Users (Coming Soon)

- CRUD operations for managing users

### Hotels (Coming Soon)

- CRUD operations for managing hotels

### Feedback (Coming Soon)

- Public submission endpoint
- Feedback management endpoints

### Categories (Coming Soon)

- CRUD operations for feedback categories

### Analytics & Reporting (Coming Soon)

- Endpoints for analytics and data export

## License

This project is proprietary and confidential. 