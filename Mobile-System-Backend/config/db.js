import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    const uri = process.env.MONGO_URI;
    // Options useNewUrlParser and useUnifiedTopology are deprecated in MongoDB Driver v4.0+
    await mongoose.connect(uri);
    console.log("Database Connected Successfully");
  } catch (err) {
    console.error("DB connect error:", err.message);
    process.exit(1);
  }
};
