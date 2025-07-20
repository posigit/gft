import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { IconWrapper } from "../components/common/IconWrapper";
import {
  Feedback,
  FeedbackType,
  FeedbackStatus,
  Hotel,
  UserRole,
} from "../types";
import {
  FiPlus,
  FiDownload,
  FiSearch,
  FiFilter,
  FiX,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const FeedbackList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
    hotelId: "",
    status: "",
    type: "",
    dateFrom: "",
    dateTo: "",
    rating: "",
    search: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch hotels
        const hotelsResponse = await api.hotels.getAll();
        if (hotelsResponse.success && hotelsResponse.data) {
          setHotels(hotelsResponse.data);
        }

        // Fetch feedback with filters
        const apiFilters: any = {};

        // If user is hotel admin, only show their hotel's feedback
        if (user?.role === UserRole.HOTEL_ADMIN && user.hotelId) {
          apiFilters.hotelId = user.hotelId;
        } else if (filters.hotelId) {
          apiFilters.hotelId = filters.hotelId;
        }

        if (filters.status) apiFilters.status = filters.status;
        if (filters.type) apiFilters.type = filters.type;
        if (filters.dateFrom) apiFilters.dateFrom = filters.dateFrom;
        if (filters.dateTo) apiFilters.dateTo = filters.dateTo;
        if (filters.rating) apiFilters.rating = parseInt(filters.rating);

        const feedbackResponse = await api.feedback.getAll(apiFilters);

        if (feedbackResponse.success && feedbackResponse.data) {
          // Extract feedback array from the nested response structure
          let feedbackData: Feedback[] = [];

          // Check if data is an array directly or nested in a 'feedback' property
          if (Array.isArray(feedbackResponse.data)) {
            feedbackData = feedbackResponse.data;
          } else if (
            feedbackResponse.data.feedback &&
            Array.isArray(feedbackResponse.data.feedback)
          ) {
            feedbackData = feedbackResponse.data.feedback;
          } else {
            console.error(
              "Unexpected feedback data structure:",
              feedbackResponse.data
            );
            setError("Unexpected data format received from server");
            setFeedback([]);
            setIsLoading(false);
            return;
          }

          // Apply search filter client-side
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            feedbackData = feedbackData.filter(
              (item) =>
                (item.guestName &&
                  item.guestName.toLowerCase().includes(searchTerm)) ||
                item.message.toLowerCase().includes(searchTerm) ||
                (item.roomNumber &&
                  item.roomNumber.toLowerCase().includes(searchTerm)) ||
                (item.hotelName &&
                  item.hotelName.toLowerCase().includes(searchTerm))
            );
          }

          setFeedback(feedbackData);
        } else {
          setError(feedbackResponse.error || "Failed to fetch feedback data");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, filters]);

  // Handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      hotelId: "",
      status: "",
      type: "",
      dateFrom: "",
      dateTo: "",
      rating: "",
      search: "",
    });
    setCurrentPage(1);
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

  // Handle row click to navigate to detail page
  const handleRowClick = (id: string | undefined) => {
    if (!id) {
      console.error("Cannot navigate to feedback detail: ID is undefined");
      return;
    }
    navigate(`/feedback/${id}`);
  };

  // Export to CSV
  const exportToCSV = () => {
    // In a real app, this would generate a CSV file
    alert("Export functionality would be implemented here");
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Make sure feedback is an array before calling slice
  const currentItems = Array.isArray(feedback)
    ? feedback.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.ceil(
    (Array.isArray(feedback) ? feedback.length : 0) / itemsPerPage
  );

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Feedback</h1>
          <p className="text-subtext">Manage and track all guest feedback</p>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={exportToCSV}
            className="btn btn-ghost flex items-center justify-center"
          >
            <IconWrapper icon={FiDownload} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconWrapper icon={FiSearch} className="h-5 w-5 text-subtext" />
            </div>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search feedback..."
              className="input-field pl-10 w-full"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-ghost flex items-center justify-center"
          >
            <IconWrapper icon={FiFilter} className="mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user?.role === UserRole.SUPER_ADMIN && (
                <div>
                  <label
                    htmlFor="hotelId"
                    className="block text-sm font-medium text-heading mb-1"
                  >
                    Hotel
                  </label>
                  <select
                    id="hotelId"
                    name="hotelId"
                    value={filters.hotelId}
                    onChange={handleFilterChange}
                    className="input-field w-full"
                  >
                    <option value="">All Hotels</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="input-field w-full"
                >
                  <option value="">All Statuses</option>
                  {Object.values(FeedbackStatus)
                    .filter((status) => status !== FeedbackStatus.PENDING)
                    .map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="input-field w-full"
                >
                  <option value="">All Types</option>
                  {Object.values(FeedbackType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="dateFrom"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  From Date
                </label>
                <input
                  type="date"
                  id="dateFrom"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="dateTo"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  To Date
                </label>
                <input
                  type="date"
                  id="dateTo"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Rating
                </label>
                <select
                  id="rating"
                  name="rating"
                  value={filters.rating}
                  onChange={handleFilterChange}
                  className="input-field w-full"
                >
                  <option value="">All Ratings</option>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Star{rating !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="btn btn-ghost flex items-center"
              >
                <IconWrapper icon={FiX} className="mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Table */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
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
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                      Room
                    </th>
                    {user?.role === UserRole.SUPER_ADMIN && (
                      <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                        Hotel
                      </th>
                    )}
                    <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                      Type
                    </th>
                    <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((item, index) => (
                      <tr
                        key={item.id || item._id || `feedback-${index}`}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(item.id || item._id)}
                      >
                        <td className="py-4 whitespace-nowrap text-sm">
                          {item.guestName || "Anonymous"}
                        </td>
                        <td className="py-4 whitespace-nowrap text-sm">
                          {item.roomNumber}
                        </td>
                        {user?.role === UserRole.SUPER_ADMIN && (
                          <td className="py-4 whitespace-nowrap text-sm">
                            {(() => {
                              // Case 1: Hotel is populated as an object with name
                              if (
                                item.hotel &&
                                typeof item.hotel === "object" &&
                                item.hotel.name
                              ) {
                                return item.hotel.name;
                              }

                              // Case 2: We have a hotelName directly
                              if (item.hotelName) {
                                return item.hotelName;
                              }

                              // Case 3: Hotel is an ID and we have the hotels list
                              if (item.hotelId) {
                                const foundHotel = hotels.find(
                                  (h) =>
                                    (h.id && h.id === item.hotelId) ||
                                    (h._id && h._id === item.hotelId)
                                );
                                if (foundHotel) return foundHotel.name;
                              }

                              // Case 4: Hotel is an ID stored in the hotel field
                              if (
                                item.hotel &&
                                typeof item.hotel === "string"
                              ) {
                                const foundHotel = hotels.find(
                                  (h) =>
                                    (h.id && h.id === item.hotel) ||
                                    (h._id && h._id === item.hotel)
                                );
                                if (foundHotel) return foundHotel.name;
                              }

                              // Fallback
                              return "Unknown";
                            })()}
                          </td>
                        )}
                        <td className="py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.type === FeedbackType.COMPLAINT
                                ? "bg-red-100 text-red-800"
                                : item.type === FeedbackType.SUGGESTION
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-4 whitespace-nowrap text-sm">
                          {"⭐".repeat(item.rating)}
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === FeedbackStatus.PENDING
                                ? "bg-yellow-100 text-yellow-800"
                                : item.status === FeedbackStatus.IN_PROGRESS
                                ? "bg-blue-100 text-blue-800"
                                : item.status === FeedbackStatus.RESOLVED
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 whitespace-nowrap text-sm text-subtext">
                          {formatDate(item.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key="no-feedback">
                      <td
                        colSpan={user?.role === UserRole.SUPER_ADMIN ? 7 : 6}
                        className="py-4 text-center text-subtext"
                      >
                        No feedback found matching the filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {feedback.length > 0 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="text-sm text-subtext">
                  Showing {indexOfFirstItem + 1}-
                  {Math.min(indexOfLastItem, feedback.length)} of{" "}
                  {feedback.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-subtext hover:bg-gray-100"
                    }`}
                  >
                    <IconWrapper icon={FiChevronLeft} size={20} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, and pages around current page
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, i, arr) => {
                      // Add ellipsis between non-consecutive pages
                      const showEllipsis = i > 0 && page - arr[i - 1] > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span
                              key={`ellipsis-${page}`}
                              className="px-3 py-1 text-subtext"
                            >
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => paginate(page)}
                            className={`px-3 py-1 rounded-md ${
                              currentPage === page
                                ? "bg-primary text-white"
                                : "text-subtext hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full ${
                      currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-subtext hover:bg-gray-100"
                    }`}
                  >
                    <IconWrapper icon={FiChevronRight} size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackList;
