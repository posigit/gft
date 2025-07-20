import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { api } from "../services/api";
import { FeedbackType, FeedbackStatus, Hotel, Feedback } from "../types";
import { IconWrapper } from "../components/common/IconWrapper";
import {
  FiArrowLeft,
  FiCheck,
  FiAlertCircle,
  FiStar,
  FiSend,
} from "react-icons/fi";

// Form validation schema
const schema = yup
  .object({
    guestName: yup.string().notRequired(),
    roomNumber: yup.string().required("Room number is required"),
    hotelId: yup.string().required("Hotel is required"),
    message: yup
      .string()
      .required("Feedback message is required")
      .min(10, "Message must be at least 10 characters"),
    type: yup
      .string()
      .required("Feedback type is required")
      .oneOf(Object.values(FeedbackType)),
    rating: yup.number().required("Rating is required").min(1).max(5),
  })
  .required();

// Form data type
type FeedbackFormData = yup.InferType<typeof schema>;

const FeedbackForm: React.FC = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FeedbackFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      type: FeedbackType.COMPLAINT,
      rating: 0,
    },
  });

  // Watch the form values
  const watchType = watch("type");

  useEffect(() => {
    // Fetch hotels for dropdown
    const fetchHotels = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.hotels.getAll();

        if (response.success && response.data) {
          setHotels(response.data);

          // Set default hotel if there's only one
          if (response.data.length === 1) {
            setValue("hotelId", response.data[0].id);
          }
        } else {
          setError(response.error || "Failed to fetch hotels");
        }
      } catch (err) {
        setError("An error occurred while fetching hotels");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, [setValue]);

  // Handle star rating click
  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    setValue("rating", selectedRating);
  };

  // Handle form submission
  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert feedback type from UPPERCASE to Title Case (e.g., "COMPLAINT" to "Complaint")
      const convertToTitleCase = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      const feedbackData = {
        guestName: data.guestName || undefined,
        roomNumber: data.roomNumber,
        hotel: data.hotelId,
        feedbackType: convertToTitleCase(data.type),
        message: data.message,
        rating: data.rating,
        status: "Pending",
      };

      const response = await api.feedback.create(feedbackData);

      if (response.success && response.data) {
        setSuccess(true);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/feedback");
        }, 2000);
      } else {
        setError(response.error || "Failed to submit feedback");
      }
    } catch (err) {
      setError("An error occurred while submitting feedback");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Submit New Feedback
        </h1>
      </div>

      <div className="card max-w-3xl mx-auto">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <IconWrapper icon={FiCheck} className="text-green-600 text-3xl" />
            </div>
            <h2 className="mt-4 text-xl font-medium text-heading">
              Feedback Submitted Successfully
            </h2>
            <p className="mt-2 text-subtext">
              Thank you for your feedback. Redirecting...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="guestName"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Guest Name (Optional)
                </label>
                <input
                  type="text"
                  id="guestName"
                  {...register("guestName")}
                  className="input-field w-full"
                  placeholder="Enter guest name"
                />
                {errors.guestName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.guestName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="roomNumber"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Room Number *
                </label>
                <input
                  type="text"
                  id="roomNumber"
                  {...register("roomNumber")}
                  className="input-field w-full"
                  placeholder="Enter room number"
                />
                {errors.roomNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.roomNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="hotelId"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Hotel *
                </label>
                <select
                  id="hotelId"
                  {...register("hotelId")}
                  className="input-field w-full"
                  disabled={isLoading}
                >
                  <option value="">Select Hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
                {errors.hotelId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.hotelId.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Feedback Type *
                </label>
                <select
                  id="type"
                  {...register("type")}
                  className="input-field w-full"
                >
                  {Object.values(FeedbackType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.type.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-heading mb-1"
              >
                Feedback Message *
              </label>
              <textarea
                id="message"
                rows={4}
                {...register("message")}
                className="input-field w-full"
                placeholder={`Enter your ${
                  watchType?.toLowerCase() || "feedback"
                } here...`}
              ></textarea>
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.message.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-heading mb-1">
                Rating *
              </label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-2xl text-yellow-400 focus:outline-none"
                  >
                    <IconWrapper icon={FiStar} />
                  </button>
                ))}
                <span className="ml-2 text-sm text-subtext">
                  {rating > 0
                    ? `${rating} star${rating !== 1 ? "s" : ""}`
                    : "Select rating"}
                </span>
              </div>
              {errors.rating && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.rating.message}
                </p>
              )}
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
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <IconWrapper icon={FiSend} className="mr-2" />
                    Submit Feedback
                  </div>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;
