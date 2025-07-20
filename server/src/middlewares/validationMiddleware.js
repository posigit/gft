const { z } = require("zod");

/**
 * Middleware to validate request data against a Zod schema
 * @param {Object} schema - Zod schema for validation
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  try {
    // Validate request data against schema
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    next();
  } catch (error) {
    // Format Zod validation errors
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));

    res.status(400).json({
      success: false,
      data: null,
      error: {
        message: "Validation failed",
        details: formattedErrors,
      },
    });
  }
};

// User schemas
const userSchemas = {
  // Login schema
  login: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    }),
  }),

  // Register schema
  register: z.object({
    body: z.object({
      firstName: z.string().min(2, "First name must be at least 2 characters"),
      lastName: z.string().min(2, "Last name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z.enum(["SUPER_ADMIN", "HOTEL_ADMIN"]),
      hotel: z.string().optional(),
    }),
  }),

  // Refresh token schema
  refresh: z.object({
    body: z.object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    }),
  }),

  // Update profile schema
  updateProfile: z.object({
    body: z.object({
      firstName: z
        .string()
        .min(2, "First name must be at least 2 characters")
        .optional(),
      lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters")
        .optional(),
      email: z.string().email("Invalid email address").optional(),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .optional(),
    }),
  }),
};

// Feedback schemas
const feedbackSchemas = {
  // Create feedback schema
  create: z.object({
    body: z.object({
      guestName: z.string().optional(),
      roomNumber: z.string().min(1, "Room number is required"),
      hotel: z.string().min(1, "Hotel ID is required"),
      feedbackType: z.enum(["Complaint", "Suggestion", "Praise"]),
      message: z
        .string()
        .min(5, "Feedback message must be at least 5 characters"),
      rating: z.number().min(1).max(5),
    }),
  }),

  // Update feedback schema
  update: z.object({
    body: z.object({
      status: z
        .enum(["Pending", "In Progress", "Resolved", "Escalated"])
        .optional(),
      assignedTo: z.string().optional(),
      categories: z.array(z.string()).optional(),
    }),
    params: z.object({
      id: z.string().min(1, "Feedback ID is required"),
    }),
  }),
};

// Hotel schemas
const hotelSchemas = {
  // Create hotel schema
  create: z.object({
    body: z.object({
      name: z.string().min(3, "Hotel name must be at least 3 characters"),
      location: z.string().min(2, "Location must be at least 2 characters"),
      address: z.string().min(5, "Address must be at least 5 characters"),
      contactEmail: z.string().email("Invalid contact email"),
      contactPhone: z
        .string()
        .min(7, "Contact phone must be at least 7 characters"),
    }),
  }),

  // Update hotel schema
  update: z.object({
    body: z.object({
      name: z
        .string()
        .min(3, "Hotel name must be at least 3 characters")
        .optional(),
      location: z
        .string()
        .min(2, "Location must be at least 2 characters")
        .optional(),
      address: z
        .string()
        .min(5, "Address must be at least 5 characters")
        .optional(),
      contactEmail: z.string().email("Invalid contact email").optional(),
      contactPhone: z
        .string()
        .min(7, "Contact phone must be at least 7 characters")
        .optional(),
      isActive: z.boolean().optional(),
    }),
    params: z.object({
      id: z.string().min(1, "Hotel ID is required"),
    }),
  }),
};

module.exports = {
  validate,
  userSchemas,
  feedbackSchemas,
  hotelSchemas,
};
