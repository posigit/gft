import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  DashboardStats,
  FeedbackType,
  FeedbackStatus,
  Hotel,
  UserRole,
} from "../types";
import {
  FiDownload,
  FiAlertCircle,
  FiFilter,
  FiX,
  FiBarChart2,
  FiPieChart,
} from "react-icons/fi";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { IconWrapper } from "../components/common/IconWrapper";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch hotels if user is super admin
        if (user?.role === UserRole.SUPER_ADMIN) {
          const hotelsResponse = await api.hotels.getAll();
          if (hotelsResponse.success && hotelsResponse.data) {
            setHotels(hotelsResponse.data);
          }
        }

        // Fetch dashboard stats
        const hotelId =
          user?.role === UserRole.HOTEL_ADMIN
            ? user.hotelId
            : selectedHotel || undefined;

        const statsResponse = await api.dashboard.getStats(hotelId);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        } else {
          setError(statsResponse.error || "Failed to fetch report data");
        }
      } catch (err) {
        setError("An error occurred while fetching report data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, selectedHotel]);

  // Handle hotel selection
  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHotel(e.target.value);
  };

  // Handle date range change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedHotel("");
    setDateRange({ from: "", to: "" });
  };

  // Export to Excel
  const exportToExcel = () => {
    // In a real app, this would generate an Excel file
    alert("Export to Excel functionality would be implemented here");
  };

  // Export to PDF
  const exportToPDF = () => {
    // In a real app, this would generate a PDF file
    alert("Export to PDF functionality would be implemented here");
  };

  // Prepare data for pie chart
  const pieChartData = {
    labels: ["Complaints", "Suggestions", "Praise"],
    datasets: [
      {
        data: stats
          ? [
              stats.feedbackByType?.[FeedbackType.COMPLAINT] || stats.byType?.complaint || 0,
              stats.feedbackByType?.[FeedbackType.SUGGESTION] || stats.byType?.suggestion || 0,
              stats.feedbackByType?.[FeedbackType.PRAISE] || stats.byType?.praise || 0,
            ]
          : [0, 0, 0],
        backgroundColor: ["#FFA3A3", "#FFD36A", "#76D7C4"],
        borderWidth: 0,
      },
    ],
  };

  // Prepare data for status bar chart
  const statusChartData = {
    labels: ["Pending", "In Progress", "Resolved", "Escalated"],
    datasets: [
      {
        data: stats
          ? [
              stats.feedbackByStatus?.[FeedbackStatus.PENDING] || stats.byStatus?.pending || 0,
              stats.feedbackByStatus?.[FeedbackStatus.IN_PROGRESS] || stats.byStatus?.inProgress || 0,
              stats.feedbackByStatus?.[FeedbackStatus.RESOLVED] || stats.byStatus?.resolved || 0,
              stats.feedbackByStatus?.[FeedbackStatus.ESCALATED] || stats.byStatus?.escalated || 0,
            ]
          : [0, 0, 0, 0],
        backgroundColor: [
          "#FFD36A",
          "#7A4FFF",
          "#76D7C4",
          "#FFA3A3",
        ],
        borderWidth: 0,
      },
    ],
  };

  // Bar chart options
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Reports</h1>
          <p className="text-subtext">
            {user?.role === UserRole.SUPER_ADMIN
              ? selectedHotel
                ? `Reports for ${hotels.find(h => h.id === selectedHotel)?.name || selectedHotel}`
                : "Reports for All Hotels"
              : `Reports for ${
                  user?.hotelId
                    ? "your hotel"
                    : "your hotel"
                }`}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={exportToExcel}
            className="btn btn-ghost flex items-center justify-center"
          >
            <IconWrapper icon={FiDownload} className="mr-2" />
            Export Excel
          </button>

          <button
            onClick={exportToPDF}
            className="btn btn-ghost flex items-center justify-center"
          >
            <IconWrapper icon={FiDownload} className="mr-2" />
            Export PDF
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-ghost flex items-center justify-center"
          >
            <IconWrapper icon={FiFilter} className="mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role === UserRole.SUPER_ADMIN && (
              <div>
                <label
                  htmlFor="hotelSelect"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Hotel
                </label>
                <select
                  id="hotelSelect"
                  value={selectedHotel}
                  onChange={handleHotelChange}
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
                htmlFor="dateFrom"
                className="block text-sm font-medium text-heading mb-1"
              >
                From Date
              </label>
              <input
                type="date"
                id="dateFrom"
                name="from"
                value={dateRange.from}
                onChange={handleDateChange}
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
                name="to"
                value={dateRange.to}
                onChange={handleDateChange}
                className="input-field w-full"
              />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
            <IconWrapper icon={FiBarChart2} className="text-primary text-xl" />
          </div>
          <div>
            <p className="text-subtext text-sm">Total Feedback</p>
            <h3 className="text-2xl font-semibold text-heading">
              {stats?.totalFeedback || 0}
            </h3>
          </div>
        </div>

        <div className="card flex items-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <IconWrapper icon={FiPieChart} className="text-red-500 text-xl" />
          </div>
          <div>
            <p className="text-subtext text-sm">Complaints</p>
            <h3 className="text-2xl font-semibold text-heading">
              {stats?.feedbackByType?.[FeedbackType.COMPLAINT] || stats?.byType?.complaint || 0}
            </h3>
          </div>
        </div>

        <div className="card flex items-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
            <IconWrapper
              icon={FiPieChart}
              className="text-yellow-500 text-xl"
            />
          </div>
          <div>
            <p className="text-subtext text-sm">Suggestions</p>
            <h3 className="text-2xl font-semibold text-heading">
              {stats?.feedbackByType?.[FeedbackType.SUGGESTION] || stats?.byType?.suggestion || 0}
            </h3>
          </div>
        </div>

        <div className="card flex items-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
            <IconWrapper icon={FiPieChart} className="text-green-500 text-xl" />
          </div>
          <div>
            <p className="text-subtext text-sm">Praise</p>
            <h3 className="text-2xl font-semibold text-heading">
              {stats?.feedbackByType?.[FeedbackType.PRAISE] || stats?.byType?.praise || 0}
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
            <Pie data={pieChartData} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="w-4 h-4 bg-red-300 rounded-full mx-auto"></div>
              <p className="text-xs mt-1 text-subtext">Complaints</p>
              <p className="font-medium">
                {stats?.feedbackByType?.[FeedbackType.COMPLAINT] || stats?.byType?.complaint || 0}
              </p>
            </div>
            <div>
              <div className="w-4 h-4 bg-yellow-300 rounded-full mx-auto"></div>
              <p className="text-xs mt-1 text-subtext">Suggestions</p>
              <p className="font-medium">
                {stats?.feedbackByType?.[FeedbackType.SUGGESTION] || stats?.byType?.suggestion || 0}
              </p>
            </div>
            <div>
              <div className="w-4 h-4 bg-green-300 rounded-full mx-auto"></div>
              <p className="text-xs mt-1 text-subtext">Praise</p>
              <p className="font-medium">
                {stats?.feedbackByType?.[FeedbackType.PRAISE] || stats?.byType?.praise || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-heading mb-4">
            Feedback by Status
          </h3>
          <div className="h-64">
            <Bar options={barChartOptions} data={statusChartData} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="w-4 h-4 bg-yellow-300 rounded-full mx-auto"></div>
              <p className="text-xs mt-1 text-subtext">Pending</p>
              <p className="font-medium">
                {stats?.feedbackByStatus?.[FeedbackStatus.PENDING] || stats?.byStatus?.pending || 0}
              </p>
            </div>
            <div>
              <div className="w-4 h-4 bg-blue-300 rounded-full mx-auto"></div>
              <p className="text-xs mt-1 text-subtext">In Progress</p>
              <p className="font-medium">
                {stats?.feedbackByStatus?.[FeedbackStatus.IN_PROGRESS] || stats?.byStatus?.inProgress || 0}
              </p>
            </div>
            <div>
              <div className="w-4 h-4 bg-green-300 rounded-full mx-auto"></div>
              <p className="text-xs mt-1 text-subtext">Resolved</p>
              <p className="font-medium">
                {stats?.feedbackByStatus?.[FeedbackStatus.RESOLVED] || stats?.byStatus?.resolved || 0}
              </p>
            </div>
            <div>
              <div className="w-4 h-4 bg-red-300 rounded-full mx-auto"></div>
              <p className="text-xs mt-1 text-subtext">Escalated</p>
              <p className="font-medium">
                {stats?.feedbackByStatus?.[FeedbackStatus.ESCALATED] || stats?.byStatus?.escalated || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hotel Performance (Super Admin Only) */}
      {user?.role === UserRole.SUPER_ADMIN && !selectedHotel && (
        <div className="card">
          <h3 className="text-lg font-medium text-heading mb-4">
            Hotel Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                    Total Feedback
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                    Complaints
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                    Suggestions
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                    Praise
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                    Avg. Rating
                  </th>
                  <th className="py-3 text-left text-xs font-medium text-subtext uppercase tracking-wider">
                    Resolution Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hotels.map((hotel) => {
                  // Mock data for each hotel
                  const totalFeedback = Math.floor(Math.random() * 50) + 10;
                  const complaints = Math.floor(
                    Math.random() * totalFeedback * 0.4
                  );
                  const suggestions = Math.floor(
                    Math.random() * totalFeedback * 0.3
                  );
                  const praise = totalFeedback - complaints - suggestions;
                  const avgRating = (3 + Math.random() * 2).toFixed(1);
                  const resolved = Math.floor(
                    Math.random() * totalFeedback * 0.8
                  );
                  const resolutionRate = (
                    (resolved / totalFeedback) *
                    100
                  ).toFixed(0);

                  return (
                    <tr key={hotel.id} className="hover:bg-gray-50">
                      <td className="py-4 whitespace-nowrap text-sm font-medium">
                        {hotel.name}
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm">
                        {totalFeedback}
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm">
                        {complaints}
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm">
                        {suggestions}
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm">
                        {praise}
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm">
                        {avgRating}
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className="mr-2">{resolutionRate}%</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{ width: `${resolutionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
