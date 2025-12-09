import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  dog1Id: { type: mongoose.Schema.Types.ObjectId, required: true },
  dog2Id: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true });

const Match = mongoose.model('Match', MatchSchema);
export default Match;
