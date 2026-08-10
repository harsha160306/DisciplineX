import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user_name: { type: String, required: true },
  user_role: { type: String, required: true },
  action: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('ActivityLog', activityLogSchema);
