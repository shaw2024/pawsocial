import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing MongoDB connection...');

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('✅ Connection closed successfully.');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });