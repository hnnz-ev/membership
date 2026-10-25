import mongoose from 'mongoose';

const BenefitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['url', 'account'], required: true },
  url: { type: String },
  accounts: [{ type: String }], // Array baris akun "email|password"
  dailyLimit: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Benefit || mongoose.model('Benefit', BenefitSchema);
