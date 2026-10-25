import mongoose from 'mongoose';
import Product from '../models/Product.js';

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

    // Purane products ke featured/trending flags ko naye fields mein copy karo
    try {
      const result = await Product.syncLegacyFlags();
      if (result.featured || result.trending) {
        console.log('🔄 Synced legacy product flags:', result);
      }
    } catch (syncErr) {
      console.error('⚠️ Flag sync skipped:', syncErr.message);
    }
  } catch (err) {
    // err.message mein password nahi hota
    console.error('❌ MONGO ERROR:', err.message);
  }
};

export default connectDB;
