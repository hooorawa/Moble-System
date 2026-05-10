import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["customer"], 
    default: "customer" 
  },
  // One-to-Many relationship with Address
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address"
  }],
  // One-to-Many relationship with Order
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }],
  // Additional customer fields for flexibility
  phoneNumber: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  preferences: {
    newsletter: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

const customerModel = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
export default customerModel;
