import mongoose from 'mongoose';

const DogSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    age: Number,
    breed: String,
    gender: String,
    energy: String,
    temperament: [String],
    vaccinated: Boolean,
    images: [String],           // no "required: true" here
    location: {
      city: String,
      zip: String
    }
  },
  { timestamps: true }
);

const Dog = mongoose.model('Dog', DogSchema);
export default Dog;
