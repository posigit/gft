import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { api } from "../services/api";
import { FeedbackType, FeedbackStatus, Hotel } from "../types";
import { FiSend, FiAlertCircle, FiCheck, FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { IconWrapper } from "../components/common/IconWrapper";

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

// Helper function to get query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const GuestFeedbackForm: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const hotelIdFromUrl = query.get("hotelId");

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
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

          // If hotelId is provided in URL, set it as the default
          if (hotelIdFromUrl) {
            setValue("hotelId", hotelIdFromUrl);
            const hotel = response.data.find((h) => h.id === hotelIdFromUrl);
            if (hotel) {
              setSelectedHotel(hotel);
            }
          }
          // Set default hotel if there's only one
          else if (response.data.length === 1) {
            setValue("hotelId", response.data[0].id);
            setSelectedHotel(response.data[0]);
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
  }, [setValue, hotelIdFromUrl]);

  // Handle hotel selection change
  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const hotel = hotels.find((h) => h.id === selectedId);
    if (hotel) {
      setSelectedHotel(hotel);
    } else {
      setSelectedHotel(null);
    }
  };

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
        feedbackType: convertToTitleCase(data.type), // Convert to title case
        message: data.message,
        rating: data.rating,
        status: "Pending", // Use title case for status
      };

      const response = await api.feedback.create(feedbackData);

      if (response.success && response.data) {
        setSuccess(true);
        // Clear form or reset
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Presken Hotels Logo"
            className="h-20 mx-auto mb-4"
            onError={(e) => {
              e.currentTarget.src = "/logo2.png";
              e.currentTarget.onerror = null;
            }}
          />
          <h1 className="text-3xl font-bold text-primary">Guest Feedback</h1>
          {selectedHotel && (
            <p className="mt-2 text-xl text-gray-700">{selectedHotel.name}</p>
          )}
          <p className="mt-2 text-lg text-gray-600">
            We value your opinion! Please share your experience with us.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {success ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <IconWrapper
                  icon={FiCheck}
                  className="text-green-600 text-4xl"
                />
              </div>
              <h2 className="mt-6 text-2xl font-medium text-heading">
                Thank You for Your Feedback!
              </h2>
              <p className="mt-2 text-lg text-subtext max-w-md mx-auto">
                Your feedback has been submitted successfully. We appreciate you
                taking the time to share your experience with us.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-8 btn btn-primary"
              >
                Submit Another Feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
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
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="guestName"
                    {...register("guestName")}
                    className="input-field w-full"
                    placeholder="Enter your name"
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
                    placeholder="Enter your room number"
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
                    disabled={isLoading || !!hotelIdFromUrl}
                    onChange={handleHotelChange}
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
                        {type.charAt(0) + type.slice(1).toLowerCase()}
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

              <div className="mt-6">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-heading mb-1"
                >
                  Your Feedback *
                </label>
                <textarea
                  id="message"
                  rows={4}
                  {...register("message")}
                  className="input-field w-full"
                  placeholder={`Please share your ${
                    watchType?.toLowerCase() || "feedback"
                  } with us...`}
                ></textarea>
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-heading mb-2">
                  Rate Your Experience *
                </label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="text-2xl mr-1 focus:outline-none"
                    >
                      <IconWrapper
                        icon={
                          hoveredRating >= star || rating >= star
                            ? FaStar
                            : FiStar
                        }
                        className={`${
                          hoveredRating >= star || rating >= star
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating > 0
                      ? `${rating} star${rating > 1 ? "s" : ""}`
                      : "Select rating"}
                  </span>
                </div>
                {errors.rating && rating === 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.rating.message}
                  </p>
                )}
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full py-3"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <IconWrapper icon={FiSend} className="mr-2" />
                      Submit Feedback
                    </div>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Presken Hotels. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestFeedbackForm;
