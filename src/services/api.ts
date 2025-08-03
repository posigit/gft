import axios from "axios";
import {
  Feedback,
  FeedbackStatus,
  FeedbackType,
  Hotel,
  DashboardStats,
  ApiResponse,
  User,
  UserRole,
  LoginCredentials,
  RegisterUserData,
} from "../types";

// Create axios instance
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `API Response [${response.config.method?.toUpperCase()}] ${
        response.config.url
      }:`,
      response.data
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error response
    console.error(
      `API Error [${originalRequest.method?.toUpperCase()}] ${
        originalRequest.url
      }:`,
      error.response?.data || error.message
    );

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        if (response.data.success) {
          // Save the new tokens
          localStorage.setItem("accessToken", response.data.data.accessToken);
          localStorage.setItem("refreshToken", response.data.data.refreshToken);

          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;

          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Failed to refresh token, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Service
export const api = {
  // Auth API
  auth: {
    // Login
    login: async (
      credentials: LoginCredentials
    ): Promise<
      ApiResponse<{
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
        hotel?: string;
        accessToken: string;
        refreshToken: string;
      }>
    > => {
      try {
        const response = await axiosInstance.post("/auth/login", credentials);

        // Save tokens to localStorage
        if (response.data.success) {
          localStorage.setItem("accessToken", response.data.data.accessToken);
          localStorage.setItem("refreshToken", response.data.data.refreshToken);
        }

        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: undefined,
          error: error.response?.data?.error || "Login failed",
        };
      }
    },

    // Change password
    changePassword: async (data: {
      currentPassword: string;
      newPassword: string;
    }): Promise<ApiResponse<any>> => {
      try {
        // The backend only expects 'password' for the new password
        const response = await axiosInstance.put("/auth/profile", {
          password: data.newPassword,
        });
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: null,
          error:
            error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to change password",
        };
      }
    },

    // Register (admin only)
    register: async (
      userData: RegisterUserData
    ): Promise<ApiResponse<User>> => {
      try {
        const response = await axiosInstance.post("/auth/register", userData);
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: undefined,
          error: error.response?.data?.error || "Registration failed",
        };
      }
    },

    // Logout
    logout: async (): Promise<ApiResponse<null>> => {
      try {
        const response = await axiosInstance.post("/auth/logout");

        // Clear tokens
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        return response.data;
      } catch (error: any) {
        // Clear tokens anyway
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        return {
          success: false,
          data: null,
          error: error.response?.data?.error || "Logout failed",
        };
      }
    },

    // Get user profile
    getProfile: async (): Promise<ApiResponse<User>> => {
      try {
        const response = await axiosInstance.get("/auth/profile");
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: undefined,
          error: error.response?.data?.error || "Failed to get profile",
        };
      }
    },
  },

  // Feedback API
  feedback: {
    // Helper function to convert frontend status to backend format
    _convertStatusToBackend: (status: FeedbackStatus): string => {
      const statusMap: Record<FeedbackStatus, string> = {
        [FeedbackStatus.PENDING]: "Pending",
        [FeedbackStatus.IN_PROGRESS]: "In Progress",
        [FeedbackStatus.RESOLVED]: "Resolved",
        [FeedbackStatus.ESCALATED]: "Escalated",
      };
      return statusMap[status] || status;
    },

    // Helper function to convert backend status to frontend format
    _convertStatusToFrontend: (status: string): FeedbackStatus => {
      const statusMap: Record<string, FeedbackStatus> = {
        Pending: FeedbackStatus.PENDING,
        "In Progress": FeedbackStatus.IN_PROGRESS,
        Resolved: FeedbackStatus.RESOLVED,
        Escalated: FeedbackStatus.ESCALATED,
      };
      return statusMap[status] || FeedbackStatus.PENDING;
    },

    // Helper function to convert frontend feedback type to backend format
    _convertTypeToBackend: (type: FeedbackType): string => {
      const typeMap: Record<FeedbackType, string> = {
        [FeedbackType.COMPLAINT]: "Complaint",
        [FeedbackType.SUGGESTION]: "Suggestion",
        [FeedbackType.PRAISE]: "Praise",
      };
      return typeMap[type] || type;
    },

    // Helper function to convert backend feedback type to frontend format
    _convertTypeToFrontend: (type: string): FeedbackType => {
      const typeMap: Record<string, FeedbackType> = {
        Complaint: FeedbackType.COMPLAINT,
        Suggestion: FeedbackType.SUGGESTION,
        Praise: FeedbackType.PRAISE,
      };
      return typeMap[type] || FeedbackType.COMPLAINT;
    },

    // Get all feedback
    getAll: async (filters?: {
      hotelId?: string;
      status?: FeedbackStatus;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
      rating?: number;
    }): Promise<
      ApiResponse<Feedback[] | { feedback: Feedback[]; pagination: any }>
    > => {
      try {
        // Construct query parameters
        const params = new URLSearchParams();
        if (filters) {
          if (filters.hotelId) params.append("hotel", filters.hotelId);
          if (filters.status)
            params.append(
              "status",
              api.feedback._convertStatusToBackend(filters.status)
            );
          if (filters.type)
            params.append(
              "type",
              api.feedback._convertTypeToBackend(filters.type as FeedbackType)
            );
          if (filters.rating) {
            // The backend expects minRating and maxRating, but we're just using a single rating value
            // So we'll set both to the same value
            params.append("minRating", filters.rating.toString());
            params.append("maxRating", filters.rating.toString());
          }
          if (filters.dateFrom) params.append("startDate", filters.dateFrom);
          if (filters.dateTo) params.append("endDate", filters.dateTo);
        }

        const response = await axiosInstance.get(
          `/feedback?${params.toString()}`
        );

        // Convert status values in the response
        if (response.data.success && response.data.data) {
          // Handle both array and object with feedback array
          const feedbackArray = Array.isArray(response.data.data)
            ? response.data.data
            : response.data.data.feedback;

          if (Array.isArray(feedbackArray)) {
            feedbackArray.forEach((item) => {
              if (item.status) {
                item.status = api.feedback._convertStatusToFrontend(
                  item.status
                );
              }
              if (item.feedbackType) {
                item.type = api.feedback._convertTypeToFrontend(
                  item.feedbackType
                );
              }
            });
          }
        }

        // Return the response as is, let the component handle the structure
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: [],
          error: error.response?.data?.error || "Failed to fetch feedback",
        };
      }
    },

    // Get feedback by ID
    getById: async (id: string): Promise<ApiResponse<Feedback>> => {
      try {
        const response = await axiosInstance.get(`/feedback/${id}`);

        // Convert status value in the response
        if (
          response.data.success &&
          response.data.data &&
          response.data.data.status
        ) {
          response.data.data.status = api.feedback._convertStatusToFrontend(
            response.data.data.status
          );
        }

        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: undefined as unknown as Feedback,
          error: error.response?.data?.error || "Feedback not found",
        };
      }
    },

    // Create new feedback (public submission)
    create: async (data: {
      guestName?: string;
      roomNumber: string;
      hotel: string;
      feedbackType: string;
      message: string;
      rating: number;
      status?: string;
    }): Promise<ApiResponse<any>> => {
      try {
        // Convert status if provided
        const payload = { ...data };
        if (payload.status) {
          payload.status = api.feedback._convertStatusToBackend(
            payload.status as FeedbackStatus
          );
        }

        const response = await axiosInstance.post("/feedback/submit", payload);
        return response.data;
      } catch (error: any) {
        console.error("API Error [POST] /feedback/submit:", error);
        return {
          success: false,
          data: undefined,
          error:
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to submit feedback",
        };
      }
    },

    // Update feedback
    update: async (
      id: string,
      data: Partial<Feedback>
    ): Promise<ApiResponse<Feedback>> => {
      try {
        // For status updates (with or without assignedTo)
        if (data.status) {
          const payload: any = {
            status: api.feedback._convertStatusToBackend(data.status),
          };

          // Include assignedTo as assignedToName if provided
          if (data.assignedTo !== undefined) {
            payload.assignedTo = data.assignedTo;
          }

          const response = await axiosInstance.put(
            `/feedback/${id}/status`,
            payload
          );

          // Convert status back to frontend format if needed
          if (
            response.data.success &&
            response.data.data &&
            response.data.data.status
          ) {
            response.data.data.status = api.feedback._convertStatusToFrontend(
              response.data.data.status
            );
          }

          return response.data;
        }

        // For category updates
        if (data.categories && Object.keys(data).length === 1) {
          const response = await axiosInstance.put(
            `/feedback/${id}/categories`,
            {
              categories: data.categories,
            }
          );
          return response.data;
        }

        // General updates - not currently supported directly in API
        return {
          success: false,
          data: undefined as unknown as Feedback,
          error: "This update operation is not supported",
        };
      } catch (error: any) {
        return {
          success: false,
          data: undefined as unknown as Feedback,
          error:
            error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to update feedback",
        };
      }
    },

    // Add response to feedback
    addResponse: async (
      feedbackId: string,
      message: string
    ): Promise<ApiResponse<any>> => {
      try {
        const response = await axiosInstance.post(
          `/feedback/${feedbackId}/responses`,
          {
            message,
          }
        );
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: null,
          error: error.response?.data?.error || "Failed to add response",
        };
      }
    },

    // Get responses for feedback
    getResponses: async (feedbackId: string): Promise<ApiResponse<any[]>> => {
      try {
        const response = await axiosInstance.get(
          `/feedback/${feedbackId}/responses`
        );
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: [],
          error: error.response?.data?.error || "Failed to fetch responses",
        };
      }
    },
  },

  // Hotels API
  hotels: {
    // Get all hotels
    getAll: async (): Promise<ApiResponse<Hotel[]>> => {
      try {
        const response = await axiosInstance.get("/hotels");
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: [],
          error: error.response?.data?.error || "Failed to fetch hotels",
        };
      }
    },

    // Get public hotels (for feedback form)
    getPublicHotels: async (): Promise<ApiResponse<Hotel[]>> => {
      try {
        const response = await axiosInstance.get("/hotels/public");
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: [],
          error: error.response?.data?.error || "Failed to fetch hotels",
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
          error: error.response?.data?.error || "Hotel not found",
        };
      }
    },

    // Create new hotel (admin only)
    create: async (
      data: Omit<Hotel, "id" | "createdAt" | "updatedAt"> & {
        adminPassword?: string;
      }
    ): Promise<ApiResponse<Hotel>> => {
      try {
        const response = await axiosInstance.post("/hotels", data);
        return response.data;
      } catch (error: any) {
        console.error(
          "Hotel creation error:",
          error.response?.data || error.message
        );
        return {
          success: false,
          data: undefined as unknown as Hotel,
          error:
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to create hotel",
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
          error: error.response?.data?.error || "Failed to update hotel",
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
          error: error.response?.data?.error || "Failed to delete hotel",
        };
      }
    },

    // Generate QR code for hotel (Already implemented)
    generateQRCode: async (
      id: string
    ): Promise<ApiResponse<{ qrCodeUrl: string; feedbackUrl: string }>> => {
      try {
        const response = await axiosInstance.post(`/hotels/${id}/qrcode`);
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: { qrCodeUrl: "", feedbackUrl: "" },
          error: error.response?.data?.error || "Failed to generate QR code",
        };
      }
    },
  },

  // Dashboard API
  dashboard: {
    // Get dashboard statistics
    getStats: async (
      hotelId?: string,
      startDate?: string,
      endDate?: string
    ): Promise<ApiResponse<DashboardStats>> => {
      try {
        const params = new URLSearchParams();
        if (hotelId) params.append("hotelId", hotelId);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const response = await axiosInstance.get(
          `/dashboard/stats?${params.toString()}`
        );
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: undefined as unknown as DashboardStats,
          error:
            error.response?.data?.error || "Failed to fetch dashboard stats",
        };
      }
    },

    // Get feedback trends
    getTrends: async (
      hotelId?: string,
      days: number = 7,
      startDate?: string,
      endDate?: string
    ): Promise<ApiResponse<any>> => {
      try {
        const params = new URLSearchParams();
        if (hotelId) params.append("hotelId", hotelId);
        
        // If start and end dates are provided, use them instead of days
        if (startDate && endDate) {
          params.append("startDate", startDate);
          params.append("endDate", endDate);
          console.log(`API requesting trends from ${startDate} to ${endDate}`);
        } else {
          // Otherwise use the days parameter
          params.append("days", days.toString());
          console.log(`API requesting trends for last ${days} days`);
        }

        const response = await axiosInstance.get(
          `/dashboard/trends?${params.toString()}`
        );
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: null,
          error:
            error.response?.data?.error || "Failed to fetch feedback trends",
        };
      }
    },

    // Get hotels comparison (Super Admin only)
    getHotelsComparison: async (): Promise<ApiResponse<any>> => {
      try {
        const response = await axiosInstance.get(
          "/dashboard/hotels-comparison"
        );
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: null,
          error:
            error.response?.data?.error || "Failed to fetch hotels comparison",
        };
      }
    },
  },

  // Categories API
  categories: {
    // Get all categories
    getAll: async (): Promise<ApiResponse<any[]>> => {
      try {
        const response = await axiosInstance.get("/categories");
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: [],
          error: error.response?.data?.error || "Failed to fetch categories",
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
          error: error.response?.data?.error || "Category not found",
        };
      }
    },

    // Create new category
    create: async (data: any): Promise<ApiResponse<any>> => {
      try {
        const response = await axiosInstance.post("/categories", data);
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: null,
          error: error.response?.data?.error || "Failed to create category",
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
          error: error.response?.data?.error || "Failed to update category",
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
          error: error.response?.data?.error || "Failed to delete category",
        };
      }
    },
  },

  // Users API
  users: {
    // Get current user
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
      try {
        const response = await axiosInstance.get("/auth/profile");
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: undefined as unknown as User,
          error: error.response?.data?.error || "Failed to get user profile",
        };
      }
    },

    // Get all users (Super Admin only)
    getAll: async (): Promise<ApiResponse<User[]>> => {
      try {
        const response = await axiosInstance.get("/users");
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: [],
          error: error.response?.data?.error || "Failed to fetch users",
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
          error: error.response?.data?.error || "User not found",
        };
      }
    },

    // Update user
    update: async (
      id: string,
      data: Partial<User>
    ): Promise<ApiResponse<User>> => {
      try {
        const response = await axiosInstance.put(`/users/${id}`, data);
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          data: undefined as unknown as User,
          error: error.response?.data?.error || "Failed to update user",
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
          error: error.response?.data?.error || "Failed to delete user",
        };
      }
    },
  },

  // Export API
  export: {
    // Export to Excel
    toExcel: async (filters?: {
      hotelId?: string;
      dateFrom?: string;
      dateTo?: string;
      type?: string;
      status?: FeedbackStatus;
      rating?: number;
    }): Promise<Blob> => {
      try {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.hotelId) params.append("hotel", filters.hotelId);
          if (filters.dateFrom) params.append("startDate", filters.dateFrom);
          if (filters.dateTo) params.append("endDate", filters.dateTo);
          if (filters.type)
            params.append(
              "feedbackType",
              api.feedback._convertTypeToBackend(filters.type as FeedbackType)
            );
          if (filters.status)
            params.append(
              "status",
              api.feedback._convertStatusToBackend(filters.status)
            );
          if (filters.rating) {
            params.append("minRating", filters.rating.toString());
            params.append("maxRating", filters.rating.toString());
          }
        }

        const response = await axiosInstance.get(
          `/export/excel?${params.toString()}`,
          {
            responseType: "blob",
          }
        );

        return response.data;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error || "Failed to export to Excel"
        );
      }
    },

    // Export to PDF
    toPDF: async (filters?: {
      hotelId?: string;
      dateFrom?: string;
      dateTo?: string;
      type?: string;
      status?: FeedbackStatus;
      rating?: number;
    }): Promise<Blob> => {
      try {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.hotelId) params.append("hotel", filters.hotelId);
          if (filters.dateFrom) params.append("startDate", filters.dateFrom);
          if (filters.dateTo) params.append("endDate", filters.dateTo);
          if (filters.type)
            params.append(
              "feedbackType",
              api.feedback._convertTypeToBackend(filters.type as FeedbackType)
            );
          if (filters.status)
            params.append(
              "status",
              api.feedback._convertStatusToBackend(filters.status)
            );
          if (filters.rating) {
            params.append("minRating", filters.rating.toString());
            params.append("maxRating", filters.rating.toString());
          }
        }

        const response = await axiosInstance.get(
          `/export/pdf?${params.toString()}`,
          {
            responseType: "blob",
          }
        );

        return response.data;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error || "Failed to export to PDF"
        );
      }
    },
  },
};
