import mongoose from '../config/database.js';

const DogSchema = new mongoose.Schema({
  ownerId: { type: Number, default: 1 },
  name: { type: String, required: true },
  age: { type: Number },
  breed: { type: String },
  gender: { type: String },
  energy: { type: String },
  temperament: { type: [String], default: [] },
  vaccinated: { type: Boolean, default: false },
  images: { type: [String], default: [] },
  city: { type: String },
  zip: { type: String }
}, { timestamps: true });

const Dog = mongoose.model('Dog', DogSchema);
export default Dog;
