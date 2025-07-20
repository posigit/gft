// User Types
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  HOTEL_ADMIN = "HOTEL_ADMIN",
}

export interface User {
  id: string;
  _id?: string; // For backend compatibility
  name: string;
  firstName?: string; // For backend compatibility
  lastName?: string; // For backend compatibility
  email: string;
  role: UserRole;
  hotelId?: string; // Only for HOTEL_ADMIN
  hotel?: string; // Backend uses 'hotel' instead of 'hotelId'
  createdAt: string;
  updatedAt?: string;
}

// Hotel Types
export interface Hotel {
  id: string;
  _id?: string; // For backend compatibility
  name: string;
  location: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  updatedAt?: string;
}

// Feedback Types
export enum FeedbackType {
  COMPLAINT = "COMPLAINT",
  SUGGESTION = "SUGGESTION",
  PRAISE = "PRAISE",
}

export enum FeedbackStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  ESCALATED = "ESCALATED",
}

export interface Feedback {
  id: string;
  _id?: string; // For backend compatibility
  hotelId?: string; // For frontend usage
  hotel?:
    | string
    | {
        // Backend may return populated hotel object
        _id: string;
        id?: string;
        name: string;
        location?: string;
      };
  hotelName?: string; // For displaying hotel name in UI
  guestName?: string;
  roomNumber?: string;
  type: FeedbackType;
  message: string;
  rating: number;
  status: FeedbackStatus;
  assignedTo?: string; // MongoDB ObjectId reference
  assignedToName?: string; // Staff name as a string
  categories?: string[]; // Added - array of category IDs
  responses?: any[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalFeedback: number;
  pendingCount?: number;
  resolvedCount?: number;
  averageRating: number;
  feedbackByType?: {
    [FeedbackType.COMPLAINT]: number;
    [FeedbackType.SUGGESTION]: number;
    [FeedbackType.PRAISE]: number;
  };
  feedbackByStatus?: {
    [FeedbackStatus.PENDING]: number;
    [FeedbackStatus.IN_PROGRESS]: number;
    [FeedbackStatus.RESOLVED]: number;
    [FeedbackStatus.ESCALATED]: number;
  };
  byType?: {
    complaint: number;
    suggestion: number;
    praise: number;
  };
  byStatus?: {
    pending: number;
    inProgress: number;
    resolved: number;
    escalated: number;
  };
  recentFeedback?: Feedback[];
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  hotel?: string; // Hotel ID, required for HOTEL_ADMIN
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
