const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Category = require("../models/Category");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Connect to the database
const connectDB = require("../config/db");

/**
 * Create initial Super Admin user
 */
const createSuperAdmin = async () => {
  try {
    // Check if super admin already exists
    const adminExists = await User.findOne({ role: "SUPER_ADMIN" });

    if (adminExists) {
      console.log("Super Admin already exists");
      return;
    }

    // Create super admin
    const superAdmin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: "admin@presken.com",
      password: "admin123", // Will be hashed by the pre-save hook
      role: "SUPER_ADMIN",
    });

    console.log("Super Admin created:", superAdmin.email);
  } catch (error) {
    console.error("Error creating Super Admin:", error);
  }
};

/**
 * Create initial hotel branches
 */
const createHotels = async () => {
  try {
    // Check if hotels already exist
    const hotelCount = await Hotel.countDocuments();

    if (hotelCount > 0) {
      console.log(`${hotelCount} hotels already exist`);
      return;
    }

    // Sample hotel data for 21 branches
    const hotelData = [
      {
        name: "Presken Lagos Central",
        location: "Lagos",
        address: "123 Broad Street, Lagos Island",
        contactEmail: "lagos.central@presken.com",
        contactPhone: "+234 801 234 5678",
      },
      {
        name: "Presken Lagos Mainland",
        location: "Lagos",
        address: "456 Ikorodu Road, Ikeja",
        contactEmail: "lagos.mainland@presken.com",
        contactPhone: "+234 802 345 6789",
      },
      {
        name: "Presken Abuja Central",
        location: "Abuja",
        address: "789 Constitution Avenue, Central District",
        contactEmail: "abuja.central@presken.com",
        contactPhone: "+234 803 456 7890",
      },
      // Add more hotels to reach 21 total
      // ... 18 more hotels
    ];

    // Create hotels
    const hotels = await Hotel.insertMany(hotelData);

    console.log(`${hotels.length} hotels created`);
  } catch (error) {
    console.error("Error creating hotels:", error);
  }
};

/**
 * Create initial feedback categories
 */
const createCategories = async () => {
  try {
    // Check if categories already exist
    const categoryCount = await Category.countDocuments();

    if (categoryCount > 0) {
      console.log(`${categoryCount} categories already exist`);
      return;
    }

    // Find super admin
    const admin = await User.findOne({ role: "SUPER_ADMIN" });

    if (!admin) {
      console.error("Super Admin not found");
      return;
    }

    // Global categories
    const globalCategories = [
      {
        name: "Room Cleanliness",
        description: "Feedback related to room cleaning and hygiene",
        isGlobal: true,
        createdBy: admin._id,
      },
      {
        name: "Staff Service",
        description: "Feedback about staff behavior and service quality",
        isGlobal: true,
        createdBy: admin._id,
      },
      {
        name: "Food Quality",
        description: "Feedback on restaurant and room service food",
        isGlobal: true,
        createdBy: admin._id,
      },
      {
        name: "Facilities",
        description: "Feedback on hotel amenities and facilities",
        isGlobal: true,
        createdBy: admin._id,
      },
      {
        name: "Value for Money",
        description: "Feedback on pricing and value perception",
        isGlobal: true,
        createdBy: admin._id,
      },
    ];

    // Create categories
    const categories = await Category.insertMany(globalCategories);

    console.log(`${categories.length} global categories created`);
  } catch (error) {
    console.error("Error creating categories:", error);
  }
};

/**
 * Run all seed functions
 */
const seedAll = async () => {
  try {
    await connectDB();
    await createSuperAdmin();
    await createHotels();
    await createCategories();

    console.log("Seed data created successfully");
    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedAll();
}

module.exports = { createSuperAdmin, createHotels, createCategories, seedAll };
