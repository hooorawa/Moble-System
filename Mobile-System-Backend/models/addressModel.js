import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  postalCode: { 
    type: String, 
    required: true 
  },
  phoneNumber: { 
    type: String, 
    required: true 
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true
  },
  // Address type for better organization
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  // Whether this is the default address for the customer
  isDefault: {
    type: Boolean,
    default: false
  },
  // Additional fields for flexibility
  state: String,
  country: {
    type: String,
    default: 'Sri Lanka'
  },
  landmark: String,
  instructions: String
}, { timestamps: true });

const addressModel = mongoose.models.Address || mongoose.model("Address", addressSchema);
export default addressModel;
