import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiUser, FiLock, FiAlertCircle } from "react-icons/fi";
import { IconWrapper } from "../components/common/IconWrapper";

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login: React.FC = () => {
  const { login, isAuthenticated, error, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // If user is already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const from =
    (location.state as LocationState)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login({ email, password });
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/logo2.png"
            alt="Presken GFT Logo"
            className="h-20 mx-auto mb-4"
          />
          <h2 className="mt-2 text-xl text-heading">Guest Feedback Tracker</h2>
          <p className="mt-2 text-sm text-subtext">Sign in to your account</p>
        </div>

        <div className="card mt-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <IconWrapper icon={FiAlertCircle} className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-heading mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconWrapper icon={FiUser} className="h-5 w-5 text-subtext" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-heading mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconWrapper icon={FiLock} className="h-5 w-5 text-subtext" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary w-full shadow-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>

            <div className="text-center text-sm text-subtext">
              <p>
                For demo purposes:
                <br />
                Hotel Admin: reliance@presken.com / reliance123
                <br />
                Hotel Admin: castle@presken.com / castle123
                <br />
                Hotel Admin: awolowo@presken.com / awolowo111
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
