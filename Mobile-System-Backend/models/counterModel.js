import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  value: {
    type: Number,
    default: 1000,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Counter', counterSchema);
