import mongoose from "mongoose";

const employerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      required: true,
      default: 'cashier'
    },
    isActive: { type: Boolean, default: true },
    permissions: {
      categories: { type: Boolean, default: false },
      brands: { type: Boolean, default: false },
      variations: { type: Boolean, default: false },
      products: { type: Boolean, default: false },
      stock: { type: Boolean, default: false },
      orders: { type: Boolean, default: false },
      paymentRecords: { type: Boolean, default: false },
      billingInvoice: { type: Boolean, default: false },
      cardReload: { type: Boolean, default: false },
      employers: { type: Boolean, default: false },
      attendance: { type: Boolean, default: false },
      attendanceList: { type: Boolean, default: false },
      services: { type: Boolean, default: false },
      supplies: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

const employerModel =
  mongoose.models.Employer || mongoose.model("Employer", employerSchema);
export default employerModel;
