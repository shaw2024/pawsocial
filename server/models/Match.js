import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    dog1: { type: mongoose.Schema.Types.ObjectId, ref: "Dog", required: true },
    dog2: { type: mongoose.Schema.Types.ObjectId, ref: "Dog", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Match", MatchSchema);
