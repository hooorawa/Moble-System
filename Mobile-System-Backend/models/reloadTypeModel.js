import mongoose from 'mongoose';

const reloadTypeSchema = new mongoose.Schema(
  {
    typeName: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const ReloadType = mongoose.model('ReloadType', reloadTypeSchema);
export default ReloadType;
