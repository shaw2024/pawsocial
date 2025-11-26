import mongoose from '../config/database.js';

const DogSchema = new mongoose.Schema({
  ownerId: { type: Number, default: 1 },
  name: { type: String, required: true },
  age: Number,
  breed: String,
  gender: String,
  energy: String,
  temperament: { type: [String], default: [] },
  vaccinated: { type: Boolean, default: false },
  images: { type: [String], default: [] },
  city: String,
  zip: String
}, { timestamps: true });

const Dog = mongoose.model('Dog', DogSchema);
export default Dog;
