import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  FiHome,
  FiMessageSquare,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiX,
  FiMenu,
  FiBell,
} from "react-icons/fi";
import { IconWrapper } from "../common/IconWrapper";

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: FiHome,
    },
    {
      name: "Feedback",
      path: "/feedback",
      icon: FiMessageSquare,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FiBarChart2,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: FiSettings,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar for desktop */}
      <div
        className={`bg-white shadow-md z-20 hidden md:block transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`flex items-center justify-center h-16 border-b ${
              sidebarOpen ? "px-6" : "px-2"
            }`}
          >
            {sidebarOpen ? (
              <img src="/logo2.png" alt="Presken GFT Logo" className="h-10" />
            ) : (
              <img src="/logo2.png" alt="Presken GFT Logo" className="h-10" />
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-4 overflow-y-auto">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center w-full px-3 py-3 transition-colors rounded-xl ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-subtext hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3">
                      <IconWrapper icon={item.icon} size={20} />
                    </span>
                    {sidebarOpen && <span>{item.name}</span>}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* User Profile */}
          <div
            className={`border-t p-4 ${
              sidebarOpen ? "" : "flex justify-center"
            }`}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                {user?.name.substring(0, 2).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-subtext">{user?.role}</p>
                </div>
              )}
            </div>
            {sidebarOpen ? (
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 mt-2 text-sm text-subtext hover:bg-gray-100 rounded-xl"
              >
                <IconWrapper icon={FiLogOut} className="mr-2" />
                Logout
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-10 h-10 mt-2 text-subtext hover:bg-gray-100 rounded-full"
                title="Logout"
              >
                <IconWrapper icon={FiLogOut} size={18} />
              </button>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-5 -right-3 bg-white rounded-full p-1 shadow-md"
          >
            {sidebarOpen ? (
              <IconWrapper icon={FiX} size={16} className="text-subtext" />
            ) : (
              <IconWrapper icon={FiMenu} size={16} className="text-subtext" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden bg-black bg-opacity-50 transition-opacity ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-6 border-b">
              <img src="/logo2.png" alt="Presken GFT Logo" className="h-10" />
              <button onClick={() => setMobileMenuOpen(false)}>
                <IconWrapper icon={FiX} size={24} className="text-subtext" />
              </button>
            </div>

            <div className="flex-1 px-3 py-4 overflow-y-auto">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-3 transition-colors rounded-xl ${
                      isActive(item.path)
                        ? "bg-primary/10 text-primary"
                        : "text-subtext hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-3">
                      <IconWrapper icon={item.icon} size={20} />
                    </span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="border-t p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  {user?.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-subtext">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 mt-2 text-sm text-subtext hover:bg-gray-100 rounded-xl"
              >
                <IconWrapper icon={FiLogOut} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="md:hidden mr-3 text-subtext"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <IconWrapper icon={FiMenu} size={24} />
                </button>
                <h1 className="text-lg font-semibold text-heading">
                  {navItems.find((item) => isActive(item.path))?.name ||
                    "Dashboard"}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <button className="text-subtext hover:text-heading">
                  <IconWrapper icon={FiBell} size={20} />
                </button>
                <div className="relative group">
                  <button
                    onClick={handleLogout}
                    className="text-subtext hover:text-heading p-1"
                    aria-label="Logout"
                  >
                    <IconWrapper icon={FiLogOut} size={20} />
                  </button>
                  <div className="absolute right-0 w-auto min-w-max top-10 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100">
                    Logout
                  </div>
                </div>
                <div className="md:hidden">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                    {user?.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
