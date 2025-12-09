import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema(
  {
    fromDog: { type: mongoose.Schema.Types.ObjectId, ref: "Dog", required: true },
    toDog: { type: mongoose.Schema.Types.ObjectId, ref: "Dog", required: true },
    action: { type: String, enum: ["like", "pass"], required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Like", LikeSchema);
