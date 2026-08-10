import mongoose from 'mongoose';

const scannedIdCardSchema = new mongoose.Schema({
  register_number: { type: String, required: true },
  name: { type: String, required: true },
  branch: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('ScannedIdCard', scannedIdCardSchema);
