import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
  dogId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetDogId: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true });

const Like = mongoose.model('Like', LikeSchema);
export default Like;
