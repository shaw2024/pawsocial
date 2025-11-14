import mongoose from "mongoose";

const DogSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    age: Number,
    breed: String,
    gender: String, // "male" | "female"
    energy: String, // "low" | "medium" | "high"
    temperament: [String], // e.g. ["playful", "friendly"]
    vaccinated: Boolean,
    images: [String],
    location: {
      city: String,
      zip: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Dog", DogSchema);
