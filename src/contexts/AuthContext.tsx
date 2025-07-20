import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState, LoginCredentials, UserRole } from "../types";
import { api } from "../services/api";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("accessToken");
    const userJson = localStorage.getItem("user");

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        return {
          ...initialState,
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        };
      } catch (error) {
        console.error("Failed to parse stored user data", error);
      }
    }

    return { ...initialState, isLoading: false };
  });

  // Login function that calls the API
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await api.auth.login(credentials);
      console.log("Login response:", response); // Debug log

      if (!response.success || !response.data) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.error || "Login failed",
        }));
        return false;
      }

      // The backend returns user data directly in the data object, not nested in a 'user' property
      const userData: User = {
        id: response.data._id,
        name: `${response.data.firstName} ${response.data.lastName}`,
        email: response.data.email,
        role: response.data.role as UserRole,
        hotelId: response.data.hotel, // This will be the hotel ID for HOTEL_ADMIN
        createdAt: new Date().toISOString(),
      };

      // Update state
      setState({
        user: userData,
        token: response.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Save to localStorage (accessToken and refreshToken are already saved in the API service)
      localStorage.setItem("user", JSON.stringify(userData));

      return true;
    } catch (error) {
      console.error("Login error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "An error occurred during login",
      }));
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call the logout API (this will clear the tokens in localStorage)
      await api.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, we still want to clear local state
    }

    // Clear user data from localStorage
    localStorage.removeItem("user");

    // Reset state
    setState({
      ...initialState,
      isLoading: false,
    });
  };

  // Check token validity on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Get user profile to validate token
        const response = await api.auth.getProfile();

        if (response.success && response.data) {
          // Transform backend user data to match our frontend User type
          const userData: User = {
            id: response.data._id || response.data.id,
            name:
              `${response.data.firstName || ""} ${
                response.data.lastName || ""
              }`.trim() ||
              response.data.name ||
              "User",
            email: response.data.email,
            role: response.data.role as UserRole,
            hotelId: response.data.hotel || response.data.hotelId, // This will be the hotel ID for HOTEL_ADMIN
            createdAt: response.data.createdAt || new Date().toISOString(),
          };

          setState({
            user: userData,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Update stored user data
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          // Token is invalid, clear auth state
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");

          setState({
            ...initialState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Token validation error:", error);
        // Token is invalid, clear auth state
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        setState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    validateToken();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
