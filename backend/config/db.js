import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not set. Add it in Render → Environment.');
    if (process.env.NODE_ENV === 'production') process.exit(1);
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // err.message never contains the password
    console.error('❌ MONGO ERROR:', err.message);
  }
};

export default connectDB;
