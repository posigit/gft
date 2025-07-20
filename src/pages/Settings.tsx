import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserRole, Hotel } from "../types";
import QRCodeGenerator from "../components/QRCodeGenerator";
import { api } from "../services/api";
import { IconWrapper } from "../components/common/IconWrapper";
import {
  FiUser,
  FiLock,
  FiMail,
  FiSave,
  FiAlertCircle,
  FiCheck,
  FiHome,
  FiMapPin,
  FiSettings,
  FiCode,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiInfo,
} from "react-icons/fi";

const Settings: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [hotelForm, setHotelForm] = useState({
    name: "",
    location: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [newHotelForm, setNewHotelForm] = useState({
    name: "",
    location: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    adminPassword: "",
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch hotels
  useEffect(() => {
    if (user?.role === UserRole.SUPER_ADMIN && activeTab === "hotels") {
      const fetchHotels = async () => {
        try {
          const response = await api.hotels.getAll();
          if (response.success && response.data) {
            setHotels(response.data);
          }
        } catch (err) {
          console.error("Failed to fetch hotels:", err);
        }
      };

      fetchHotels();
    }
  }, [user?.role, activeTab]);

  // Fetch hotel data for hotel admin
  useEffect(() => {
    if (
      user?.role === UserRole.HOTEL_ADMIN &&
      user.hotelId &&
      activeTab === "hotel"
    ) {
      const fetchHotelData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const hotelId = user.hotelId || "";
          const response = await api.hotels.getById(hotelId);
          if (response.success && response.data) {
            setHotelForm({
              name: response.data.name || "",
              location: response.data.location || "",
              address: response.data.address || "",
              contactEmail: response.data.contactEmail || "",
              contactPhone: response.data.contactPhone || "",
            });
          } else {
            setError(response.error || "Failed to fetch hotel information");
          }
        } catch (err) {
          console.error("Failed to fetch hotel data:", err);
          setError("An error occurred while fetching hotel information");
        } finally {
          setIsLoading(false);
        }
      };

      fetchHotelData();
    }
  }, [user?.role, user?.hotelId, activeTab]);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle hotel form changes
  const handleHotelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHotelForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle new hotel form changes
  const handleNewHotelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewHotelForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit profile form
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess("Profile updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }, 1000);
  };

  // Submit password form
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        setSuccess("Password updated successfully");

        // Clear form
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(response.error || "Failed to update password");
      }
    } catch (err) {
      setError("An error occurred while updating password");
      console.error(err);
    } finally {
      setIsSubmitting(false);

      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    }
  };

  // Submit hotel form
  const handleHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!user?.hotelId) {
      setError("Hotel ID not found");
      setIsSubmitting(false);
      return;
    }

    try {
      const hotelId = user.hotelId;
      const response = await api.hotels.update(hotelId, hotelForm);

      if (response.success) {
        setSuccess("Hotel information updated successfully");
      } else {
        setError(response.error || "Failed to update hotel information");
      }
    } catch (err) {
      console.error("Error updating hotel:", err);
      setError("An error occurred while updating hotel information");
    } finally {
      setIsSubmitting(false);

      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    }
  };

  // Submit new hotel form
  const handleNewHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Extract admin password from the form data
      const { adminPassword, ...hotelData } = newHotelForm;

      // Call API to create new hotel with admin password
      const response = await api.hotels.create({
        ...hotelData,
        adminPassword,
      });

      if (response.success && response.data) {
        setSuccess("Hotel created successfully with admin account");
        setHotels([...hotels, response.data]);

        // Clear form
        setNewHotelForm({
          name: "",
          location: "",
          address: "",
          contactEmail: "",
          contactPhone: "",
          adminPassword: "",
        });
      } else {
        setError(response.error || "Failed to create hotel");
      }
    } catch (err) {
      setError("An error occurred while creating the hotel");
      console.error(err);
    } finally {
      setIsSubmitting(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Settings</h1>
        <p className="text-subtext">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-subtext hover:text-heading hover:border-gray-300"
            }`}
          >
            Profile
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "password"
                ? "border-primary text-primary"
                : "border-transparent text-subtext hover:text-heading hover:border-gray-300"
            }`}
          >
            Password
          </button>

          {user?.role === UserRole.SUPER_ADMIN && (
            <button
              onClick={() => setActiveTab("hotels")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "hotels"
                  ? "border-primary text-primary"
                  : "border-transparent text-subtext hover:text-heading hover:border-gray-300"
              }`}
            >
              <span className="flex items-center">
                <IconWrapper icon={FiHome} className="mr-1" />
                Hotels Management
              </span>
            </button>
          )}

          {user?.role === UserRole.HOTEL_ADMIN && (
            <button
              onClick={() => setActiveTab("hotel")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "hotel"
                  ? "border-primary text-primary"
                  : "border-transparent text-subtext hover:text-heading hover:border-gray-300"
              }`}
            >
              Hotel Information
            </button>
          )}

          {user?.role === UserRole.HOTEL_ADMIN && (
            <button
              onClick={() => setActiveTab("feedback-qr")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "feedback-qr"
                  ? "border-primary text-primary"
                  : "border-transparent text-subtext hover:text-heading hover:border-gray-300"
              }`}
            >
              <span className="flex items-center">
                <IconWrapper icon={FiCode} className="mr-1" />
                Feedback QR
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("preferences")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "preferences"
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 cursor-not-allowed"
            }`}
            disabled={true}
            title="Coming soon"
          >
            Preferences
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
              Soon
            </span>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <IconWrapper icon={FiCheck} className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <IconWrapper
                icon={FiAlertCircle}
                className="h-5 w-5 text-red-500"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="card">
        {/* Profile Settings */}
        {activeTab === "profile" && (
          <div className="card max-w-2xl">
            <h2 className="text-lg font-medium text-heading mb-4">
              Profile Information
            </h2>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconWrapper
                      icon={FiUser}
                      className="h-5 w-5 text-subtext"
                    />
                  </div>
                  <div className="input-field pl-10 w-full bg-gray-50 text-gray-700">
                    {profileForm.name}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconWrapper
                      icon={FiMail}
                      className="h-5 w-5 text-subtext"
                    />
                  </div>
                  <div className="input-field pl-10 w-full bg-gray-50 text-gray-700">
                    {profileForm.email}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-1">
                  Role
                </label>
                <div className="input-field bg-gray-50 text-gray-700">
                  {user?.role === UserRole.SUPER_ADMIN
                    ? "Super Admin"
                    : "Hotel Admin"}
                </div>
                <p className="mt-1 text-xs text-subtext">
                  Your role cannot be changed
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Password Settings */}
        {activeTab === "password" && (
          <div className="card max-w-2xl">
            <h2 className="text-lg font-medium text-heading mb-4">
              Change Password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Hidden username field for accessibility */}
              <input
                type="text"
                autoComplete="username"
                value={user?.email || ""}
                style={{ display: "none" }}
                readOnly
              />

              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconWrapper
                      icon={FiLock}
                      className="h-5 w-5 text-subtext"
                    />
                  </div>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="input-field pl-10 w-full"
                    placeholder="Enter your current password"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconWrapper
                      icon={FiLock}
                      className="h-5 w-5 text-subtext"
                    />
                  </div>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="input-field pl-10 w-full"
                    placeholder="Enter your new password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <p className="mt-1 text-xs text-subtext">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconWrapper
                      icon={FiLock}
                      className="h-5 w-5 text-subtext"
                    />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="input-field pl-10 w-full"
                    placeholder="Confirm your new password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <IconWrapper icon={FiSave} className="mr-2" />
                      Update Password
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Hotels Management for Super Admin */}
        {activeTab === "hotels" && user?.role === UserRole.SUPER_ADMIN && (
          <div>
            <h2 className="text-lg font-medium text-heading mb-6">
              Hotels Management
            </h2>

            {/* Add New Hotel Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-md font-medium text-heading mb-4">
                Add New Hotel
              </h3>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <IconWrapper
                      icon={FiInfo}
                      className="h-5 w-5 text-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      When you create a new hotel, a Hotel Admin account will be
                      automatically created using the contact email and password
                      you provide. The hotel admin will be able to log in with
                      these credentials.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleNewHotelSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="newHotelName"
                      className="block text-sm font-medium text-heading mb-1"
                    >
                      Hotel Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IconWrapper
                          icon={FiHome}
                          className="h-5 w-5 text-subtext"
                        />
                      </div>
                      <input
                        type="text"
                        id="newHotelName"
                        name="name"
                        value={newHotelForm.name}
                        onChange={handleNewHotelChange}
                        className="input-field pl-10 w-full"
                        placeholder="Enter hotel name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="newHotelLocation"
                      className="block text-sm font-medium text-heading mb-1"
                    >
                      Location
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IconWrapper
                          icon={FiMapPin}
                          className="h-5 w-5 text-subtext"
                        />
                      </div>
                      <input
                        type="text"
                        id="newHotelLocation"
                        name="location"
                        value={newHotelForm.location}
                        onChange={handleNewHotelChange}
                        className="input-field pl-10 w-full"
                        placeholder="Enter hotel location (city)"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newHotelAddress"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconWrapper
                        icon={FiMapPin}
                        className="h-5 w-5 text-subtext"
                      />
                    </div>
                    <input
                      type="text"
                      id="newHotelAddress"
                      name="address"
                      value={newHotelForm.address}
                      onChange={handleNewHotelChange}
                      className="input-field pl-10 w-full"
                      placeholder="Enter full hotel address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="newHotelContactEmail"
                      className="block text-sm font-medium text-heading mb-1"
                    >
                      Contact Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IconWrapper
                          icon={FiMail}
                          className="h-5 w-5 text-subtext"
                        />
                      </div>
                      <input
                        type="email"
                        id="newHotelContactEmail"
                        name="contactEmail"
                        value={newHotelForm.contactEmail}
                        onChange={handleNewHotelChange}
                        className="input-field pl-10 w-full"
                        placeholder="Enter contact email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="newHotelContactPhone"
                      className="block text-sm font-medium text-heading mb-1"
                    >
                      Contact Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IconWrapper
                          icon={FiUser}
                          className="h-5 w-5 text-subtext"
                        />
                      </div>
                      <input
                        type="tel"
                        id="newHotelContactPhone"
                        name="contactPhone"
                        value={newHotelForm.contactPhone}
                        onChange={handleNewHotelChange}
                        className="input-field pl-10 w-full"
                        placeholder="Enter contact phone"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newHotelAdminPassword"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Hotel Admin Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconWrapper
                        icon={FiLock}
                        className="h-5 w-5 text-subtext"
                      />
                    </div>
                    <input
                      type="password"
                      id="newHotelAdminPassword"
                      name="adminPassword"
                      value={newHotelForm.adminPassword}
                      onChange={handleNewHotelChange}
                      className="input-field pl-10 w-full"
                      placeholder="Enter password for hotel admin"
                      required
                      minLength={8}
                    />
                    <p className="mt-1 text-xs text-subtext">
                      This password will be used to create an admin account with
                      the contact email
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <IconWrapper icon={FiPlus} className="mr-2" />
                        Add Hotel
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Hotels List */}
            <div>
              <h3 className="text-md font-medium text-heading mb-4">
                Existing Hotels
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                        Hotel Name
                      </th>
                      <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                        Location
                      </th>
                      <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                        Address
                      </th>
                      <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                        Created
                      </th>
                      <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hotels.map((hotel) => (
                      <tr key={hotel.id} className="hover:bg-gray-50">
                        <td className="py-4 whitespace-nowrap text-sm font-medium text-heading">
                          {hotel.name}
                        </td>
                        <td className="py-4 whitespace-nowrap text-sm text-gray-600">
                          {hotel.location}
                        </td>
                        <td className="py-4 text-sm text-gray-600 max-w-xs truncate">
                          {hotel.address}
                        </td>
                        <td className="py-4 whitespace-nowrap text-sm text-subtext">
                          {formatDate(hotel.createdAt)}
                        </td>
                        <td className="py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit Hotel"
                            >
                              <IconWrapper icon={FiEdit2} size={16} />
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700"
                              title="Delete Hotel"
                            >
                              <IconWrapper icon={FiTrash2} size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {hotels.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-subtext"
                        >
                          No hotels available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Hotel Information Settings */}
        {activeTab === "hotel" && user?.role === UserRole.HOTEL_ADMIN && (
          <div className="card max-w-2xl">
            <h2 className="text-lg font-medium text-heading mb-4">
              Hotel Information
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="hotelName"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Hotel Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconWrapper
                        icon={FiHome}
                        className="h-5 w-5 text-subtext"
                      />
                    </div>
                    <div className="input-field pl-10 w-full bg-gray-50 text-gray-700">
                      {hotelForm.name}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconWrapper
                        icon={FiMapPin}
                        className="h-5 w-5 text-subtext"
                      />
                    </div>
                    <div className="input-field pl-10 w-full bg-gray-50 text-gray-700">
                      {hotelForm.location}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconWrapper
                        icon={FiMapPin}
                        className="h-5 w-5 text-subtext"
                      />
                    </div>
                    <div className="input-field pl-10 w-full bg-gray-50 text-gray-700">
                      {hotelForm.address}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contactEmail"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Contact Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconWrapper
                        icon={FiMail}
                        className="h-5 w-5 text-subtext"
                      />
                    </div>
                    <div className="input-field pl-10 w-full bg-gray-50 text-gray-700">
                      {hotelForm.contactEmail}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Contact Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconWrapper
                        icon={FiUser}
                        className="h-5 w-5 text-subtext"
                      />
                    </div>
                    <div className="input-field pl-10 w-full bg-gray-50 text-gray-700">
                      {hotelForm.contactPhone}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback QR Code Generator */}
        {activeTab === "feedback-qr" && user?.role === UserRole.HOTEL_ADMIN && (
          <div>
            <h3 className="text-lg font-medium mb-4">Guest Feedback QR Code</h3>
            <p className="text-gray-600 mb-6">
              Generate a QR code that guests can scan to provide feedback about
              their stay. Display this QR code in guest rooms, reception area,
              or include it in welcome materials.
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <QRCodeGenerator
                hotelId={user?.hotelId || ""}
                hotelName={hotelForm.name}
              />
            )}
          </div>
        )}

        {/* Preferences Settings */}
        {activeTab === "preferences" && (
          <div className="card max-w-2xl">
            <h2 className="text-lg font-medium text-heading mb-4">
              Notification Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-heading">
                    Email Notifications
                  </h3>
                  <p className="text-xs text-subtext">
                    Receive email notifications for new feedback
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-heading">
                    In-App Notifications
                  </h3>
                  <p className="text-xs text-subtext">
                    Receive notifications within the application
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-heading">
                    Daily Summary
                  </h3>
                  <p className="text-xs text-subtext">
                    Receive a daily summary of feedback
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-heading mb-4">
                Display Preferences
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Language
                  </label>
                  <select
                    id="language"
                    className="input-field w-full"
                    defaultValue="en"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Time Zone
                  </label>
                  <select
                    id="timezone"
                    className="input-field w-full"
                    defaultValue="WAT"
                  >
                    <option value="WAT">West Africa Time (WAT)</option>
                    <option value="GMT">Greenwich Mean Time (GMT)</option>
                    <option value="EST">Eastern Standard Time (EST)</option>
                    <option value="CST">Central Standard Time (CST)</option>
                    <option value="PST">Pacific Standard Time (PST)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="btn btn-primary flex items-center"
                >
                  <IconWrapper icon={FiSettings} className="mr-2" />
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
