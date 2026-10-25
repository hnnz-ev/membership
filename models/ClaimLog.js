import mongoose from 'mongoose';

const ClaimLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  benefitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Benefit', required: true },
  benefitTitle: { type: String, required: true },
  claimedContent: { type: String, required: true },
  claimDate: { type: String, required: true }, // Format YYYY-MM-DD
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ClaimLog || mongoose.model('ClaimLog', ClaimLogSchema);
