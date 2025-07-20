# Frontend-Backend Integration Plan

## Overview

This document outlines the plan to fully integrate the frontend React application with the backend Node.js Express API, replacing all mock data with real API calls.

## Current Status

- Backend API has all required endpoints implemented
- Frontend has authentication already integrated
- QR code generation is integrated between frontend and backend
- Most other areas still use mock data with fallbacks

## Integration Steps

### 1. Update API Service Structure

```typescript
// src/services/api.ts

// Remove mock data imports
// import { mockFeedback, hotels, generateDashboardStats } from "./mockData";

// Keep helper utilities but mark as fallback only
// For development/testing when backend is unavailable
const createMockResponse = <T>(
  data: T,
  success = true,
  error?: string
): Promise<ApiResponse<T>> => {
  console.warn("Using mock data fallback - backend may be unavailable");
  return delay(300).then(() => ({ success, data, error }));
};
```

### 2. Authentication API (Already Implemented)

- ✅ Login
- ✅ Register
- ✅ Logout
- ✅ Get Profile

### 3. Feedback API Integration

```typescript
// Feedback API
feedback: {
  // Get all feedback
  getAll: async (filters?: {
    hotelId?: string;
    status?: FeedbackStatus;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    rating?: number;
  }): Promise<ApiResponse<Feedback[]>> => {
    try {
      // Construct query parameters
      const params = new URLSearchParams();
      if (filters) {
        if (filters.hotelId) params.append('hotelId', filters.hotelId);
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('type', filters.type);
        if (filters.rating) params.append('rating', filters.rating.toString());
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
      }

      const response = await axiosInstance.get(`/feedback?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch feedback"
      };
    }
  },

  // Get feedback by ID
  getById: async (id: string): Promise<ApiResponse<Feedback>> => {
    try {
      const response = await axiosInstance.get(`/feedback/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as Feedback,
        error: error.response?.data?.error || "Feedback not found"
      };
    }
  },

  // Create new feedback (public submission)
  create: async (
    data: Omit<Feedback, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Feedback>> => {
    try {
      const response = await axiosInstance.post('/feedback/submit', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as Feedback,
        error: error.response?.data?.error || "Failed to submit feedback"
      };
    }
  },

  // Update feedback
  update: async (
    id: string,
    data: Partial<Feedback>
  ): Promise<ApiResponse<Feedback>> => {
    try {
      // For status updates, use the specific endpoint
      if (data.status && Object.keys(data).length === 1) {
        const response = await axiosInstance.put(`/feedback/${id}/status`, {
          status: data.status
        });
        return response.data;
      }

      // For category updates
      if (data.categories && Object.keys(data).length === 1) {
        const response = await axiosInstance.put(`/feedback/${id}/categories`, {
          categories: data.categories
        });
        return response.data;
      }

      // General updates - not currently supported directly in API
      // Would need to add a general update endpoint
      return {
        success: false,
        data: undefined as unknown as Feedback,
        error: "This update operation is not supported"
      };
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as Feedback,
        error: error.response?.data?.error || "Failed to update feedback"
      };
    }
  },

  // Add response to feedback
  addResponse: async (
    feedbackId: string,
    message: string
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.post(`/feedback/${feedbackId}/responses`, {
        message
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to add response"
      };
    }
  },

  // Get responses for feedback
  getResponses: async (feedbackId: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await axiosInstance.get(`/feedback/${feedbackId}/responses`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch responses"
      };
    }
  }
},
```

### 4. Hotels API Integration

```typescript
// Hotels API
hotels: {
  // Get all hotels
  getAll: async (): Promise<ApiResponse<Hotel[]>> => {
    try {
      const response = await axiosInstance.get('/hotels');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch hotels"
      };
    }
  },

  // Get public hotels (for feedback form)
  getPublicHotels: async (): Promise<ApiResponse<Hotel[]>> => {
    try {
      const response = await axiosInstance.get('/hotels/public');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch hotels"
      };
    }
  },

  // Get hotel by ID
  getById: async (id: string): Promise<ApiResponse<Hotel>> => {
    try {
      const response = await axiosInstance.get(`/hotels/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as Hotel,
        error: error.response?.data?.error || "Hotel not found"
      };
    }
  },

  // Create new hotel
  create: async (
    data: Omit<Hotel, "id" | "createdAt">
  ): Promise<ApiResponse<Hotel>> => {
    try {
      const response = await axiosInstance.post('/hotels', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as Hotel,
        error: error.response?.data?.error || "Failed to create hotel"
      };
    }
  },

  // Update hotel
  update: async (
    id: string,
    data: Partial<Hotel>
  ): Promise<ApiResponse<Hotel>> => {
    try {
      const response = await axiosInstance.put(`/hotels/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as Hotel,
        error: error.response?.data?.error || "Failed to update hotel"
      };
    }
  },

  // Delete hotel
  delete: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.delete(`/hotels/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to delete hotel"
      };
    }
  },

  // Generate QR code for hotel (Already implemented)
  generateQRCode: async (id: string): Promise<ApiResponse<{ qrCodeUrl: string; feedbackUrl: string }>> => {
    try {
      const response = await axiosInstance.post(`/hotels/${id}/qrcode`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: { qrCodeUrl: '', feedbackUrl: '' },
        error: error.response?.data?.error || "Failed to generate QR code"
      };
    }
  }
},
```

### 5. Dashboard API Integration

```typescript
// Dashboard API
dashboard: {
  // Get dashboard statistics
  getStats: async (hotelId?: string): Promise<ApiResponse<DashboardStats>> => {
    try {
      const params = new URLSearchParams();
      if (hotelId) params.append('hotelId', hotelId);

      const response = await axiosInstance.get(`/dashboard/stats?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as DashboardStats,
        error: error.response?.data?.error || "Failed to fetch dashboard stats"
      };
    }
  },

  // Get feedback trends
  getTrends: async (hotelId?: string, days: number = 7): Promise<ApiResponse<any>> => {
    try {
      const params = new URLSearchParams();
      if (hotelId) params.append('hotelId', hotelId);
      params.append('days', days.toString());

      const response = await axiosInstance.get(`/dashboard/trends?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to fetch feedback trends"
      };
    }
  },

  // Get hotels comparison (Super Admin only)
  getHotelsComparison: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.get('/dashboard/hotels-comparison');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to fetch hotels comparison"
      };
    }
  }
},
```

### 6. Categories API Integration

```typescript
// Categories API
categories: {
  // Get all categories
  getAll: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await axiosInstance.get('/categories');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch categories"
      };
    }
  },

  // Get category by ID
  getById: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.get(`/categories/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Category not found"
      };
    }
  },

  // Create new category
  create: async (data: any): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.post('/categories', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to create category"
      };
    }
  },

  // Update category
  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to update category"
      };
    }
  },

  // Delete category
  delete: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.delete(`/categories/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to delete category"
      };
    }
  }
},
```

### 7. Users API Integration

```typescript
// Users API
users: {
  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as User,
        error: error.response?.data?.error || "Failed to get user profile"
      };
    }
  },

  // Get all users (Super Admin only)
  getAll: async (): Promise<ApiResponse<User[]>> => {
    try {
      const response = await axiosInstance.get('/users');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || "Failed to fetch users"
      };
    }
  },

  // Get user by ID
  getById: async (id: string): Promise<ApiResponse<User>> => {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as User,
        error: error.response?.data?.error || "User not found"
      };
    }
  },

  // Update user
  update: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const response = await axiosInstance.put(`/users/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: undefined as unknown as User,
        error: error.response?.data?.error || "Failed to update user"
      };
    }
  },

  // Delete user
  delete: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.delete(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to delete user"
      };
    }
  }
},
```

### 8. Export API Integration

```typescript
// Export API
export: {
  // Export to Excel
  toExcel: async (filters?: {
    hotelId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.hotelId) params.append('hotelId', filters.hotelId);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
      }

      const response = await axiosInstance.get(`/export/excel?${params.toString()}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to export to Excel");
    }
  },

  // Export to PDF
  toPDF: async (filters?: {
    hotelId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.hotelId) params.append('hotelId', filters.hotelId);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
      }

      const response = await axiosInstance.get(`/export/pdf?${params.toString()}`, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to export to PDF");
    }
  }
}
```

## Type Updates

Ensure that the frontend types match the backend schema:

```typescript
// src/types/index.ts

// Update User interface
interface User {
  _id: string; // Changed from 'id'
  firstName: string; // Changed from 'name'
  lastName: string; // Added
  email: string;
  role: UserRole;
  hotel?: string; // Reference to hotel ID
  createdAt: string;
  updatedAt?: string; // Added
}

// Update Hotel interface
interface Hotel {
  _id: string; // Changed from 'id'
  name: string;
  location: string;
  address: string; // Added
  contactEmail: string; // Added
  contactPhone: string; // Added
  isActive: boolean; // Added
  qrCodeUrl?: string; // Added
  createdAt: string;
  updatedAt?: string; // Added
}

// Update Feedback interface
interface Feedback {
  _id: string; // Changed from 'id'
  hotelId: string; // Reference to hotel ID
  guestName?: string;
  roomNumber?: string;
  type: FeedbackType;
  message: string;
  rating: number;
  status: FeedbackStatus;
  assignedTo?: string; // Added - reference to user ID
  categories?: string[]; // Added - array of category IDs
  responses?: any[]; // Added
  resolvedAt?: string; // Added
  createdAt: string;
  updatedAt?: string; // Added
}
```

## Migration Steps

1. Create the new API service as outlined above
2. Update frontend component types to match backend data structure
3. Test each endpoint integration individually
4. Remove the mockData.ts file once all integrations are confirmed working

## Testing Plan

1. Test Authentication Flow

   - Login with valid credentials
   - Attempt login with invalid credentials
   - Test token refresh mechanism
   - Test logout functionality

2. Test Feedback Management

   - Submit new feedback
   - Retrieve feedback list with various filters
   - Update feedback status
   - Add responses to feedback

3. Test Hotel Management

   - List all hotels
   - Create new hotel (Super Admin)
   - Update hotel details
   - Generate QR code

4. Test Dashboard & Reports

   - Retrieve dashboard statistics
   - Test feedback trends data
   - Test hotel comparison (Super Admin)
   - Export data in Excel and PDF formats

5. Test Categories
   - Create, retrieve, update, and delete categories

## Implementation Timeline

1. Update API service structure and remove mock data imports
2. Implement authentication-related endpoints (already done)
3. Implement hotel-related endpoints
4. Implement feedback-related endpoints
5. Implement dashboard and analytics endpoints
6. Implement category management endpoints
7. Implement export functionality
8. Update types throughout the application
9. Test all endpoints
10. Remove mockData.ts file
