import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  DashboardStats,
  FeedbackType,
  FeedbackStatus,
  Feedback,
  UserRole,
  Hotel,
} from "../types";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiHome,
  FiMessageSquare,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";
import { IconWrapper } from "../components/common/IconWrapper";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<{
    labels: string[];
    datasets: {
      total: number[];
      complaint: number[];
      suggestion: number[];
      praise: number[];
      averageRating: number[];
    };
  } | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // If user is a hotel admin, only fetch stats for their hotel
        const hotelId =
          user?.role === UserRole.HOTEL_ADMIN ? user.hotelId : undefined;

        // Fetch dashboard stats
        const statsResponse = await api.dashboard.getStats(hotelId);

        // Fetch trend data
        const trendsResponse = await api.dashboard.getTrends(hotelId, 7);

        // Fetch hotels if user is super admin
        if (user?.role === UserRole.SUPER_ADMIN) {
          const hotelsResponse = await api.hotels.getAll();
          if (hotelsResponse.success && hotelsResponse.data) {
            setHotels(hotelsResponse.data);
          }
        }

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          setError(
            statsResponse.error || "Failed to fetch dashboard statistics"
          );
        }

        if (trendsResponse.success && trendsResponse.data) {
          setTrendData(trendsResponse.data);
        }
      } catch (err) {
        setError("An error occurred while fetching dashboard data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Prepare data for pie chart
  const pieChartData = {
    labels: ["Complaints", "Suggestions", "Praise"],
    datasets: [
      {
        data: stats
          ? [
              stats.feedbackByType?.[FeedbackType.COMPLAINT] ||
                stats.byType?.complaint ||
                0,
              stats.feedbackByType?.[FeedbackType.SUGGESTION] ||
                stats.byType?.suggestion ||
                0,
              stats.feedbackByType?.[FeedbackType.PRAISE] ||
                stats.byType?.praise ||
                0,
            ]
          : [0, 0, 0],
        backgroundColor: ["#FFA3A3", "#FFD36A", "#76D7C4"],
        borderWidth: 0,
      },
    ],
  };

  // Prepare data for line chart (last 7 days trend)
  const lineChartData = {
    labels: trendData
      ? trendData.labels
      : [
          "7 days ago",
          "6 days ago",
          "5 days ago",
          "4 days ago",
          "3 days ago",
          "2 days ago",
          "Today",
        ],
    datasets: [
      {
        label: "Feedback Received",
        data: trendData ? trendData.datasets.total : [5, 8, 12, 7, 10, 15, 9],
        borderColor: "#7A4FFF",
        backgroundColor: "rgba(122, 79, 255, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Line chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: 10,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 sm:mb-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-heading">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-subtext">
          {user?.role === UserRole.SUPER_ADMIN
            ? "Overview of all hotels' feedback"
            : `Overview of ${
                user?.hotelId ? "your hotel" : "your hotel"
              }'s feedback`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card flex flex-col sm:flex-row items-center text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
            <IconWrapper
              icon={FiMessageSquare}
              className="text-primary text-xl"
            />
          </div>
          <div>
            <p className="text-subtext text-xs sm:text-sm">Total Feedback</p>
            <h3 className="text-xl sm:text-2xl font-semibold text-heading">
              {stats?.totalFeedback || 0}
            </h3>
          </div>
        </div>

        <div className="card flex flex-col sm:flex-row items-center text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
            <IconWrapper icon={FiClock} className="text-amber-500 text-xl" />
          </div>
          <div>
            <p className="text-subtext text-xs sm:text-sm">Pending</p>
            <h3 className="text-xl sm:text-2xl font-semibold text-heading">
              {stats?.pendingCount || stats?.byStatus?.pending || 0}
            </h3>
          </div>
        </div>

        <div className="card flex flex-col sm:flex-row items-center text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
            <IconWrapper
              icon={FiCheckCircle}
              className="text-green-500 text-xl"
            />
          </div>
          <div>
            <p className="text-subtext text-xs sm:text-sm">Resolved</p>
            <h3 className="text-xl sm:text-2xl font-semibold text-heading">
              {stats?.resolvedCount || stats?.byStatus?.resolved || 0}
            </h3>
          </div>
        </div>

        <div className="card flex flex-col sm:flex-row items-center text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 sm:mb-0 sm:mr-4">
            <IconWrapper icon={FiStar} className="text-blue-500 text-xl" />
          </div>
          <div>
            <p className="text-subtext text-xs sm:text-sm">Avg. Rating</p>
            <h3 className="text-xl sm:text-2xl font-semibold text-heading">
              {stats?.averageRating?.toFixed(1) || "0.0"}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-heading mb-4">
            Feedback by Type
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full max-w-[250px] md:max-w-[350px] lg:max-w-[295px]">
              <Pie data={pieChartData} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-heading mb-4">
            Feedback Trend (Last 7 Days)
          </h3>
          <div className="h-64 w-full overflow-x-auto pb-4">
            <div className="min-w-[300px] h-full">
              <Line options={lineChartOptions} data={lineChartData} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-heading">Recent Feedback</h3>
          <button
            onClick={() => (window.location.href = "/feedback")}
            className="text-sm text-primary hover:underline"
          >
            View All
          </button>
        </div>
        <div>
          {stats?.recentFeedback && stats.recentFeedback.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {stats.recentFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex flex-wrap justify-between mb-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">
                        {feedback.guestName || "Anonymous Guest"}
                      </span>
                      <span className="text-sm text-gray-500">
                        Room {feedback.roomNumber || "N/A"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(feedback.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* Hotel Tag */}
                    {user?.role === UserRole.SUPER_ADMIN && (
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary flex items-center gap-1">
                        <IconWrapper icon={FiHome} className="text-xs" />
                        {(() => {
                          // Case 1: Hotel is populated as an object with name
                          if (
                            feedback.hotel &&
                            typeof feedback.hotel === "object" &&
                            feedback.hotel.name
                          ) {
                            return feedback.hotel.name;
                          }

                          // Case 2: We have a hotelName directly
                          if (feedback.hotelName) {
                            return feedback.hotelName;
                          }

                          // Case 3: Hotel is an ID and we have the hotels list
                          if (feedback.hotelId) {
                            const foundHotel = hotels.find(
                              (h) =>
                                (h.id && h.id === feedback.hotelId) ||
                                (h._id && h._id === feedback.hotelId)
                            );
                            if (foundHotel) return foundHotel.name;
                            return "Hotel ID: " + feedback.hotelId;
                          }

                          // Case 4: Hotel is an ID stored in the hotel field
                          if (
                            feedback.hotel &&
                            typeof feedback.hotel === "string"
                          ) {
                            const foundHotel = hotels.find(
                              (h) =>
                                (h.id && h.id === feedback.hotel) ||
                                (h._id && h._id === feedback.hotel)
                            );
                            if (foundHotel) return foundHotel.name;
                            return "Hotel ID: " + feedback.hotel;
                          }

                          // Fallback
                          return "Unknown Hotel";
                        })()}
                      </span>
                    )}

                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        feedback.type === FeedbackType.COMPLAINT
                          ? "bg-red-100 text-red-800"
                          : feedback.type === FeedbackType.SUGGESTION
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {feedback.type}
                    </span>

                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        feedback.status === FeedbackStatus.PENDING
                          ? "bg-amber-100 text-amber-800"
                          : feedback.status === FeedbackStatus.IN_PROGRESS
                          ? "bg-blue-100 text-blue-800"
                          : feedback.status === FeedbackStatus.RESOLVED
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {feedback.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-2">
                    {feedback.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-subtext">
              No recent feedback available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
