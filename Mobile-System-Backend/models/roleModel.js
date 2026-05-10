import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    displayName: { 
      type: String, 
      required: true,
      trim: true
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

const roleModel = mongoose.models.Role || mongoose.model("Role", roleSchema);
export default roleModel;
