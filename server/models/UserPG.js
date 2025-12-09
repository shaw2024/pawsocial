import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  city: { type: String, required: false },
  zip: { type: String, required: false }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;
