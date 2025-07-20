import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  Feedback,
  FeedbackStatus,
  FeedbackType,
  UserRole,
  Hotel,
} from "../types";
import { IconWrapper } from "../components/common/IconWrapper";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiEdit,
  FiCheck,
  FiAlertTriangle,
  FiClock,
  FiStar,
  FiAlertCircle,
} from "react-icons/fi";

const FeedbackDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<FeedbackStatus | "">("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);

  // Redirect if no ID is provided
  useEffect(() => {
    if (!id) {
      console.error("No feedback ID provided");
      navigate("/feedback");
    }
  }, [id, navigate]);

  useEffect(() => {
    const fetchFeedbackDetail = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.feedback.getById(id);
        console.log("Feedback API Response:", response);

        if (response.success && response.data) {
          setFeedback(response.data);
          setUpdateStatus(response.data.status);
          // Use assignedToName if available, fall back to assignedTo
          setAssignedTo(
            response.data.assignedToName || response.data.assignedTo || ""
          );
        } else {
          setError(response.error || "Failed to fetch feedback details");
        }
      } catch (err) {
        setError("An error occurred while fetching feedback details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbackDetail();
  }, [id]);

  useEffect(() => {
    const fetchHotels = async () => {
      const response = await api.hotels.getAll();
      console.log("Hotels API Response:", response);

      if (response.success && response.data) {
        setHotels(response.data);
      }
    };

    fetchHotels();
  }, []);

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!feedback || !updateStatus) return;

    setIsUpdating(true);
    setError(null);
    setUpdateSuccess(false);

    // Debug the feedback object to see its structure
    console.log("Feedback object in update:", feedback);

    // Check if feedback ID exists
    const feedbackId = feedback._id || feedback.id;
    if (!feedbackId) {
      setError("Cannot update feedback: Missing ID");
      setIsUpdating(false);
      return;
    }

    // Validate that assignedTo is not empty
    if (!assignedTo.trim()) {
      setError("Staff name is required to update status");
      setIsUpdating(false);
      return;
    }

    try {
      const updateData: Partial<Feedback> = {
        status: updateStatus as FeedbackStatus,
        assignedTo: assignedTo.trim(),
      };

      console.log("Updating feedback with ID:", feedbackId);
      const response = await api.feedback.update(feedbackId, updateData);

      if (response.success && response.data) {
        setFeedback(response.data);
        setUpdateSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      } else {
        setError(response.error || "Failed to update feedback status");
      }
    } catch (err) {
      setError("An error occurred while updating feedback status");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: FeedbackStatus) => {
    switch (status) {
      case FeedbackStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case FeedbackStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case FeedbackStatus.RESOLVED:
        return "bg-green-100 text-green-800";
      case FeedbackStatus.ESCALATED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get type badge style
  const getTypeBadgeStyle = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.COMPLAINT:
        return "bg-red-100 text-red-800";
      case FeedbackType.SUGGESTION:
        return "bg-yellow-100 text-yellow-800";
      case FeedbackType.PRAISE:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: FeedbackStatus) => {
    switch (status) {
      case FeedbackStatus.PENDING:
        return <IconWrapper icon={FiClock} />;
      case FeedbackStatus.IN_PROGRESS:
        return <IconWrapper icon={FiEdit} />;
      case FeedbackStatus.RESOLVED:
        return <IconWrapper icon={FiCheck} />;
      case FeedbackStatus.ESCALATED:
        return <IconWrapper icon={FiAlertTriangle} />;
      default:
        return <IconWrapper icon={FiMessageSquare} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/feedback")}
            className="btn btn-ghost flex items-center mr-4"
          >
            <IconWrapper icon={FiArrowLeft} className="mr-2" />
            Back to List
          </button>
          <h1 className="text-2xl font-semibold text-heading">
            Feedback Detail
          </h1>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <IconWrapper
                icon={FiAlertCircle}
                className="h-5 w-5 text-red-500"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || "Feedback not found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/feedback")}
            className="btn btn-ghost flex items-center mr-4"
          >
            <IconWrapper icon={FiArrowLeft} className="mr-2" />
            Back to List
          </button>
          <h1 className="text-2xl font-semibold text-heading">
            Feedback Detail
          </h1>
        </div>

        <div className="mt-4 sm:mt-0">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyle(
              feedback.status
            )}`}
          >
            {getStatusIcon(feedback.status)}
            <span className="ml-1">{feedback.status}</span>
          </span>
        </div>
      </div>

      {/* Feedback Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeStyle(
                    feedback.type
                  )}`}
                >
                  {feedback.type}
                </span>
                <div className="ml-3 text-yellow-500">
                  {Array.from({ length: feedback.rating }, (_, i) => (
                    <IconWrapper
                      key={`star-${i}`}
                      icon={FiStar}
                      className="inline-block fill-current"
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-subtext">
                {formatDate(feedback.createdAt)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-heading">
                  Guest Information
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-subtext">Name</p>
                    <p className="font-medium">
                      {feedback.guestName || "Anonymous"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-subtext">Room Number</p>
                    <p className="font-medium">{feedback.roomNumber}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-heading">Message</h3>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                  {feedback.message}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-heading">Hotel</h3>
                <p className="mt-2 font-medium">
                  {/* Handle different possible data structures from the backend */}
                  {(() => {
                    // Case 1: Hotel is populated as an object with name
                    if (
                      feedback.hotel &&
                      typeof feedback.hotel === "object" &&
                      feedback.hotel.name
                    ) {
                      return feedback.hotel.name;
                    }

                    // Case 2: Hotel is an ID and we have the hotels list
                    if (feedback.hotelId) {
                      const foundHotel = hotels.find(
                        (h) =>
                          (h.id && h.id === feedback.hotelId) ||
                          (h._id && h._id === feedback.hotelId)
                      );
                      if (foundHotel) return foundHotel.name;
                    }

                    // Case 3: Hotel is an ID stored in the hotel field
                    if (feedback.hotel && typeof feedback.hotel === "string") {
                      const foundHotel = hotels.find(
                        (h) =>
                          (h.id && h.id === feedback.hotel) ||
                          (h._id && h._id === feedback.hotel)
                      );
                      if (foundHotel) return foundHotel.name;
                    }

                    // Case 4: We have a hotelName directly
                    if (feedback.hotelName) {
                      return feedback.hotelName;
                    }

                    // Fallback
                    return "Hotel information unavailable";
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card">
            <h3 className="text-lg font-medium text-heading mb-4">Timeline</h3>

            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconWrapper
                      icon={FiMessageSquare}
                      className="text-primary"
                    />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="font-medium">Feedback Submitted</p>
                  <p className="text-sm text-subtext">
                    {formatDate(feedback.createdAt)}
                  </p>
                </div>
              </div>

              {feedback.assignedToName && (
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <IconWrapper icon={FiEdit} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">
                      Assigned to {feedback.assignedToName}
                    </p>
                    <p className="text-sm text-subtext">
                      {feedback.status === FeedbackStatus.IN_PROGRESS
                        ? "In Progress"
                        : "Assigned"}
                    </p>
                  </div>
                </div>
              )}

              {feedback.resolvedAt && (
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <IconWrapper icon={FiCheck} className="text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Resolved</p>
                    <p className="text-sm text-subtext">
                      {formatDate(feedback.resolvedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update Status */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-heading mb-4">
              Update Status
            </h3>

            {updateSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-md mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <IconWrapper
                      icon={FiCheck}
                      className="h-5 w-5 text-green-500"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Status updated successfully
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md mb-4">
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

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={updateStatus}
                  onChange={(e) =>
                    setUpdateStatus(e.target.value as FeedbackStatus)
                  }
                  className="input-field w-full"
                >
                  <option value="">Select Status</option>
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
                  htmlFor="assignedTo"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Assigned To <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Enter staff name"
                  className="input-field w-full"
                  required
                />
                <p className="text-xs text-subtext mt-1">
                  Staff name is required to update status
                </p>
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={
                  isUpdating ||
                  !updateStatus ||
                  updateStatus === feedback.status ||
                  !assignedTo.trim()
                }
                className="btn btn-primary w-full"
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  "Update Status"
                )}
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-heading mb-4">
              Feedback Details
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-subtext">Feedback ID</p>
                <p className="font-medium">{feedback.id}</p>
              </div>

              <div>
                <p className="text-sm text-subtext">Submitted On</p>
                <p className="font-medium">{formatDate(feedback.createdAt)}</p>
              </div>

              <div>
                <p className="text-sm text-subtext">Last Updated</p>
                <p className="font-medium">{formatDate(feedback.updatedAt)}</p>
              </div>

              {feedback.resolvedAt && (
                <div>
                  <p className="text-sm text-subtext">Resolved On</p>
                  <p className="font-medium">
                    {formatDate(feedback.resolvedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetail;
