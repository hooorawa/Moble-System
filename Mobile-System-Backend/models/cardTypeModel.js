import mongoose from 'mongoose';

const cardTypeSchema = new mongoose.Schema(
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

const CardType = mongoose.model('CardType', cardTypeSchema);
export default CardType;
