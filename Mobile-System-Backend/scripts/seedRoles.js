import mongoose from "mongoose";
import roleModel from "../models/roleModel.js";
import "dotenv/config";

const seedRoles = async () => {
  try {
    // Connect to database
    const uri = process.env.MONGO_URI || "mongodb+srv://sdeshan960:jcxlVPkfLLUfboxR@cluster0.rkwulst.mongodb.net/Mobile";
    await mongoose.connect(uri);
    console.log("Connected to database");

    // Check if roles already exist
    const existingRoles = await roleModel.find();
    if (existingRoles.length > 0) {
      console.log("Roles already exist, skipping seed");
      return;
    }

    // Create default roles
    const defaultRoles = [
      {
        name: "cashier",
        displayName: "Cashier",
        isDefault: true,
        isActive: true
      },
      {
        name: "manager",
        displayName: "Manager",
        isDefault: true,
        isActive: true
      }
    ];

    await roleModel.insertMany(defaultRoles);
    console.log("Default roles seeded successfully");

  } catch (error) {
    console.error("Error seeding roles:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

seedRoles();
