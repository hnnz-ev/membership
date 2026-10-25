import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  adminPasswordHash: { type: String, required: true },
  announcementText: { type: String, default: 'Stok benefit diperbarui setiap hari!' },
  groupLink: { type: String, default: 'https://chat.whatsapp.com/demo' }
});

export default mongoose.models.Config || mongoose.model('Config', ConfigSchema);
