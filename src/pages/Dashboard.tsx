import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
        // Always use the current user's hotel ID for filtering
        // For hotel admin, this is their assigned hotel
        // For super admin viewing their own dashboard, we'll use undefined to show all hotels
        const hotelId =
          user?.role === UserRole.HOTEL_ADMIN ? user.hotelId : undefined;

        console.log("Current user:", user);
        console.log("Using hotelId for filtering:", hotelId);

        // Fetch dashboard stats
        const statsResponse = await api.dashboard.getStats(hotelId);

        // Calculate date range for the last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // Last 7 days including today

        const formattedStartDate = startDate.toISOString().split("T")[0];
        const formattedEndDate = endDate.toISOString().split("T")[0];

        console.log(
          `Fetching trend data from ${formattedStartDate} to ${formattedEndDate} for hotelId: ${
            hotelId || "all hotels"
          }`
        );

        // Always pass the hotelId to ensure proper filtering
        const trendsResponse = await api.dashboard.getTrends(
          hotelId,
          7,
          formattedStartDate,
          formattedEndDate
        );

        // Fetch hotels if user is super admin
        if (user?.role === UserRole.SUPER_ADMIN) {
          const hotelsResponse = await api.hotels.getAll();
          if (hotelsResponse.success && hotelsResponse.data) {
            setHotels(hotelsResponse.data);
          }
        }

        if (statsResponse.success && statsResponse.data) {
          console.log("Stats data:", statsResponse.data);
          setStats(statsResponse.data);
        } else {
          setError(
            statsResponse.error || "Failed to fetch dashboard statistics"
          );
        }

        if (trendsResponse.success && trendsResponse.data) {
          console.log("API Trend Data:", trendsResponse.data);

          // Check if we have data for July 30th
          if (trendsResponse.data.labels) {
            const july30Index = trendsResponse.data.labels.findIndex(
              (label: string) =>
                label.includes("2023-07-30") || label.includes("30 Jul")
            );

            console.log("July 30th index in API data:", july30Index);
            if (july30Index !== -1) {
              console.log("July 30th data:", {
                total: trendsResponse.data.datasets.total?.[july30Index],
                complaint:
                  trendsResponse.data.datasets.complaint?.[july30Index],
                suggestion:
                  trendsResponse.data.datasets.suggestion?.[july30Index],
                praise: trendsResponse.data.datasets.praise?.[july30Index],
              });
            }
          }

          setTrendData(trendsResponse.data);
        } else {
          console.error("Failed to fetch trend data:", trendsResponse.error);
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

  // Format dates for x-axis labels
  const formatDateLabel = (dateString: string) => {
    try {
      // Handle different date formats
      let date;

      // Check if the date is already in a readable format like "30 Jul"
      if (/^\d{1,2}\s[A-Za-z]{3}/.test(dateString)) {
        console.log(`Date ${dateString} is already in readable format`);
        return dateString;
      }

      // Try to parse the date
      date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error(`Invalid date string: ${dateString}`);
        return dateString; // Return original string if invalid
      }

      // Format the date for display
      const formattedDate = date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
      });

      console.log(`Formatted date ${dateString} to ${formattedDate}`);
      return formattedDate;
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      return dateString; // Return original string on error
    }
  };

  // This function has been replaced by generateLast7DaysData

  // State to track which datasets are visible
  const [visibleDatasets, setVisibleDatasets] = useState<{
    total: boolean;
    complaint: boolean;
    suggestion: boolean;
    praise: boolean;
    averageRating: boolean;
  }>({
    total: true,
    complaint: true,
    suggestion: true,
    praise: true,
    averageRating: false,
  });

  // Generate data for the last 7 days
  const generateLast7DaysData = () => {
    // Use current date at midnight to ensure consistent date handling
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const labels: string[] = [];

    // Create arrays for each dataset
    const emptyData = {
      total: [] as number[],
      complaint: [] as number[],
      suggestion: [] as number[],
      praise: [] as number[],
      averageRating: [] as number[],
    };

    console.log(
      "Generating data structure for last 7 days starting from:",
      today.toISOString()
    );

    // Generate labels for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Format as YYYY-MM-DD - ensure consistent format with API
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      labels.push(formattedDate);

      // Initialize with zeros
      emptyData.total.push(0);
      emptyData.complaint.push(0);
      emptyData.suggestion.push(0);
      emptyData.praise.push(0);
      emptyData.averageRating.push(0);
    }

    console.log("Generated 7-day labels:", labels);

    // Check if July 30th is in our date range (for debugging)
    const july30 = "2023-07-30";
    const july30Index = labels.indexOf(july30);
    if (july30Index !== -1) {
      console.log(`July 30th found at index ${july30Index}`);
    } else {
      console.log(`July 30th not in current 7-day range`);
    }

    return { labels, datasets: emptyData };
  };

  // Process the API response data and map it to the last 7 days
  const processApiData = () => {
    // Generate the base structure with the last 7 days
    const last7DaysData = generateLast7DaysData();

    // If we don't have trend data from the API, return the empty structure
    if (!trendData || !trendData.labels || !trendData.datasets) {
      console.log("No trend data available, using empty data");
      return last7DaysData;
    }

    console.log("Processing API data:", trendData);
    console.log("Base 7-day structure:", last7DaysData);

    // Create a map of dates to make lookup faster
    const dateMap = new Map();
    last7DaysData.labels.forEach((label, index) => {
      // Store both the original format and a normalized format
      dateMap.set(label, index); // YYYY-MM-DD format

      // Also store as MM/DD/YYYY format
      try {
        const date = new Date(label);
        if (!isNaN(date.getTime())) {
          const altFormat = `${
            date.getMonth() + 1
          }/${date.getDate()}/${date.getFullYear()}`;
          dateMap.set(altFormat, index);

          // Also store as DD Mon YYYY format
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const altFormat2 = `${date.getDate()} ${
            months[date.getMonth()]
          } ${date.getFullYear()}`;
          dateMap.set(altFormat2, index);

          // Also store as DD Mon format (without year)
          const altFormat3 = `${date.getDate()} ${months[date.getMonth()]}`;
          dateMap.set(altFormat3, index);
        }
      } catch (e) {
        console.error(`Error creating date formats for ${label}:`, e);
      }
    });

    console.log("Date map for lookup:", Array.from(dateMap.entries()));

    // Map the API data to our 7-day structure
    trendData.labels.forEach((apiLabel, index) => {
      try {
        console.log(`Processing API label: ${apiLabel} at index ${index}`);

        // Try to find a direct match first
        let dayIndex = -1;

        // Check if the API label matches any of our known formats
        if (dateMap.has(apiLabel)) {
          dayIndex = dateMap.get(apiLabel);
          console.log(
            `Direct match found for ${apiLabel} at index ${dayIndex}`
          );
        } else {
          // Try to normalize the date format
          try {
            const apiDate = new Date(apiLabel);
            if (!isNaN(apiDate.getTime())) {
              // Try different formats
              const formats = [
                // YYYY-MM-DD
                `${apiDate.getFullYear()}-${String(
                  apiDate.getMonth() + 1
                ).padStart(2, "0")}-${String(apiDate.getDate()).padStart(
                  2,
                  "0"
                )}`,
                // MM/DD/YYYY
                `${
                  apiDate.getMonth() + 1
                }/${apiDate.getDate()}/${apiDate.getFullYear()}`,
                // DD Mon YYYY
                `${apiDate.getDate()} ${
                  [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ][apiDate.getMonth()]
                } ${apiDate.getFullYear()}`,
                // DD Mon
                `${apiDate.getDate()} ${
                  [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ][apiDate.getMonth()]
                }`,
              ];

              console.log(
                `Trying normalized formats for ${apiLabel}:`,
                formats
              );

              // Check each format
              for (const format of formats) {
                if (dateMap.has(format)) {
                  dayIndex = dateMap.get(format);
                  console.log(
                    `Match found with format ${format} at index ${dayIndex}`
                  );
                  break;
                }
              }

              // If still no match, try to find the closest date
              if (dayIndex === -1) {
                console.log(
                  `No format match found for ${apiLabel}, trying closest date`
                );

                // Find the closest date by timestamp difference
                let closestIndex = -1;
                let minDifference = Infinity;

                last7DaysData.labels.forEach((label, labelIndex) => {
                  const labelDate = new Date(label);
                  if (!isNaN(labelDate.getTime())) {
                    const difference = Math.abs(
                      labelDate.getTime() - apiDate.getTime()
                    );

                    if (difference < minDifference) {
                      minDifference = difference;
                      closestIndex = labelIndex;
                    }
                  }
                });

                if (closestIndex !== -1) {
                  dayIndex = closestIndex;
                  console.log(
                    `Found closest date match at index ${dayIndex}: ${last7DaysData.labels[dayIndex]}`
                  );
                }
              }
            }
          } catch (e) {
            console.error(`Error normalizing date ${apiLabel}:`, e);
          }
        }

        // If we found a matching day, update the data for that day
        if (dayIndex !== -1) {
          console.log(
            `Updating data at index ${dayIndex} with values from API index ${index}`
          );

          if (
            trendData.datasets.total &&
            trendData.datasets.total[index] !== undefined
          ) {
            last7DaysData.datasets.total[dayIndex] =
              trendData.datasets.total[index];
          }

          if (
            trendData.datasets.complaint &&
            trendData.datasets.complaint[index] !== undefined
          ) {
            last7DaysData.datasets.complaint[dayIndex] =
              trendData.datasets.complaint[index];
          }

          if (
            trendData.datasets.suggestion &&
            trendData.datasets.suggestion[index] !== undefined
          ) {
            last7DaysData.datasets.suggestion[dayIndex] =
              trendData.datasets.suggestion[index];
          }

          if (
            trendData.datasets.praise &&
            trendData.datasets.praise[index] !== undefined
          ) {
            last7DaysData.datasets.praise[dayIndex] =
              trendData.datasets.praise[index];
          }

          if (
            trendData.datasets.averageRating &&
            trendData.datasets.averageRating[index] !== undefined
          ) {
            last7DaysData.datasets.averageRating[dayIndex] =
              trendData.datasets.averageRating[index];
          }
        } else {
          console.warn(
            `Could not find a matching day for API label ${apiLabel}`
          );
        }
      } catch (error) {
        console.error(`Error processing API label ${apiLabel}:`, error);
      }
    });

    console.log("Final processed data:", last7DaysData);
    return last7DaysData;
  };

  // Use processed data
  const chartData = processApiData();

  // Prepare data for line chart (last 7 days trend)
  const lineChartData = {
    labels: chartData.labels.map((label) => {
      // Format date labels to be more readable
      return label.includes("-") ? formatDateLabel(label) : label;
    }),
    datasets: [
      {
        label: "Total Feedback",
        data: visibleDatasets.total ? chartData.datasets.total : [],
        borderColor: "#7A4FFF",
        backgroundColor: "rgba(122, 79, 255, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Complaints",
        data: visibleDatasets.complaint ? chartData.datasets.complaint : [],
        borderColor: "#FF5A5A",
        backgroundColor: "transparent",
        tension: 0.4,
        fill: false,
      },
      {
        label: "Suggestions",
        data: visibleDatasets.suggestion ? chartData.datasets.suggestion : [],
        borderColor: "#FFB74D",
        backgroundColor: "transparent",
        tension: 0.4,
        fill: false,
      },
      {
        label: "Praise",
        data: visibleDatasets.praise ? chartData.datasets.praise : [],
        borderColor: "#4CAF50",
        backgroundColor: "transparent",
        tension: 0.4,
        fill: false,
      },
      // Add average rating dataset if available
      ...(chartData.datasets.averageRating
        ? [
            {
              label: "Average Rating",
              data: visibleDatasets.averageRating
                ? chartData.datasets.averageRating
                : [],
              borderColor: "#00BCD4",
              backgroundColor: "transparent",
              tension: 0.4,
              fill: false,
              yAxisID: "y1", // Use secondary y-axis
            },
          ]
        : []),
    ],
  };

  // Line chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5,
        hitRadius: 10,
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        align: "center" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
          usePointStyle: true,
        },
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
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          title: function (tooltipItems: any[]) {
            return tooltipItems[0].label;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
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
        suggestedMax: 20, // Adjust this based on your data
        title: {
          display: true,
          text: "Number of Feedback",
        },
      },
      y1: {
        type: "linear" as const,
        display:
          chartData.datasets.averageRating && visibleDatasets.averageRating,
        position: "right" as const,
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          precision: 1,
          stepSize: 1,
          font: {
            size: 11,
          },
        },
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
        title: {
          display: true,
          text: "Average Rating",
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

  // Toggle dataset visibility
  const toggleDataset = (
    dataset: "total" | "complaint" | "suggestion" | "praise" | "averageRating"
  ) => {
    // If trying to disable the only visible dataset, don't allow it
    const currentlyVisible =
      Object.values(visibleDatasets).filter(Boolean).length;
    if (currentlyVisible === 1 && visibleDatasets[dataset]) {
      return; // Don't allow turning off the last visible dataset
    }

    setVisibleDatasets((prev) => ({
      ...prev,
      [dataset]: !prev[dataset],
    }));
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-medium text-heading mb-2 sm:mb-0">
              Feedback Trend (Last 7 Days)
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleDataset("total")}
                className={`px-2 py-1 text-xs rounded-full ${
                  visibleDatasets.total
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Total
              </button>
              <button
                onClick={() => toggleDataset("complaint")}
                className={`px-2 py-1 text-xs rounded-full ${
                  visibleDatasets.complaint
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Complaints
              </button>
              <button
                onClick={() => toggleDataset("suggestion")}
                className={`px-2 py-1 text-xs rounded-full ${
                  visibleDatasets.suggestion
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Suggestions
              </button>
              <button
                onClick={() => toggleDataset("praise")}
                className={`px-2 py-1 text-xs rounded-full ${
                  visibleDatasets.praise
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Praise
              </button>
              {chartData.datasets.averageRating && (
                <button
                  onClick={() => toggleDataset("averageRating")}
                  className={`px-2 py-1 text-xs rounded-full ${
                    visibleDatasets.averageRating
                      ? "bg-cyan-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Avg. Rating
                </button>
              )}
            </div>
          </div>
          <div className="h-72 sm:h-80 w-full">
            {lineChartData.labels.length > 0 &&
            lineChartData.datasets.some((ds) => ds.data.length > 0) ? (
              <Line options={lineChartOptions} data={lineChartData} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No trend data available</p>
              </div>
            )}
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
                  className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/feedback/${feedback.id || feedback._id}`)}
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
