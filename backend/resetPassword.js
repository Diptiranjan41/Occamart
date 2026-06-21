// resetPassword.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'prabhuprasadnayak708@gmail.com' });
    
    if (!user) {
      console.log(' User not found');
      return;
    }

    console.log(' User found:', user.email);
    
    // Set new password
    const newPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Make sure user is verified
    user.isVerified = true;
    
    await user.save();
    
    console.log(' Password reset successfully!');
    console.log(' Email:', user.email);
    console.log(' New password:', newPassword);
    
    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB');
    
  } catch (error) {
    console.error(' Error:', error);
  }
};

resetPassword();
