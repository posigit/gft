# Presken Guest Feedback Tracker (GFT) Backend-Frontend Integration Checklist

## API Endpoints

### Authentication

- [x] `POST /api/auth/login` - User login
- [x] `POST /api/auth/register` - Register new user
- [x] `POST /api/auth/refresh` - Refresh token
- [x] `POST /api/auth/logout` - User logout
- [x] `GET /api/auth/profile` - Get user profile

### Users

- [x] `GET /api/users` - Get all users (Super Admin only)
- [x] `POST /api/users` - Create new user
- [x] `GET /api/users/:id` - Get specific user
- [x] `PUT /api/users/:id` - Update user
- [x] `DELETE /api/users/:id` - Delete user

### Hotels

- [x] `GET /api/hotels` - Get all hotels
- [x] `GET /api/hotels/public` - Get public hotels for feedback form
- [x] `POST /api/hotels` - Create new hotel (Super Admin only)
- [x] `GET /api/hotels/:id` - Get specific hotel
- [x] `PUT /api/hotels/:id` - Update hotel
- [x] `DELETE /api/hotels/:id` - Delete hotel
- [x] `POST /api/hotels/:id/qrcode` - Generate QR code for hotel

### Feedback

- [x] `GET /api/feedback` - Get all feedback (filtered by hotel for Hotel Admin)
- [x] `POST /api/feedback/submit` - Submit new feedback (public)
- [x] `GET /api/feedback/:id` - Get specific feedback
- [x] `PUT /api/feedback/:id/status` - Update feedback status
- [x] `PUT /api/feedback/:id/categories` - Update feedback categories

### Responses

- [x] `GET /api/feedback/:id/responses` - Get responses for feedback
- [x] `POST /api/feedback/:id/responses` - Add response to feedback

### Categories

- [x] `GET /api/categories` - Get all categories
- [x] `POST /api/categories` - Create new category
- [x] `GET /api/categories/:id` - Get specific category
- [x] `PUT /api/categories/:id` - Update category
- [x] `DELETE /api/categories/:id` - Delete category

### Dashboard

- [x] `GET /api/dashboard/stats` - Get dashboard statistics
- [x] `GET /api/dashboard/trends` - Get feedback trends
- [x] `GET /api/dashboard/hotels-comparison` - Get hotel comparison (Super Admin only)

### Export

- [x] `GET /api/export/excel` - Export to Excel
- [x] `GET /api/export/pdf` - Export to PDF

## Frontend Services Integration

### Update API Service Structure

- [x] Remove mock data imports
- [x] Update error handling for API calls
- [x] Update response type handling

### Authentication API Integration

- [x] Implement login functionality
- [x] Implement register functionality
- [x] Implement logout functionality
- [x] Implement profile retrieval
- [x] Implement token refresh mechanism

### Hotels API Integration

- [x] Implement getAll method
- [x] Implement getPublicHotels method
- [x] Implement getById method
- [x] Implement create method
- [x] Implement update method
- [x] Implement delete method
- [x] Implement generateQRCode method

### Feedback API Integration

- [x] Implement getAll method with filters
- [x] Implement getById method
- [x] Implement create (submit) method
- [x] Implement status update method
- [x] Implement categories update method
- [x] Implement response methods

### Dashboard API Integration

- [x] Implement getStats method
- [x] Implement getTrends method
- [x] Implement getHotelsComparison method

### Categories API Integration

- [x] Implement getAll method
- [x] Implement getById method
- [x] Implement create method
- [x] Implement update method
- [x] Implement delete method

### Export API Integration

- [x] Implement toExcel method
- [x] Implement toPDF method

### Users API Integration

- [x] Implement getCurrentUser method
- [x] Implement getAll method
- [x] Implement getById method
- [x] Implement update method
- [x] Implement delete method

## Type Updates

- [x] Update User interface
- [x] Update Hotel interface
- [x] Update Feedback interface
- [x] Update Category interface
- [x] Update Response interface
- [x] Update Dashboard/Stats interfaces

## Testing

- [ ] Test Authentication endpoints
- [ ] Test Users endpoints
- [ ] Test Hotels endpoints
- [ ] Test Feedback endpoints
- [ ] Test Response endpoints
- [ ] Test Categories endpoints
- [ ] Test Dashboard endpoints
- [ ] Test Export endpoints

## Final Steps

- [ ] Remove mockData.ts file
- [ ] Update API URLs for production
- [ ] Add environment-specific configurations
- [ ] Document API integration
