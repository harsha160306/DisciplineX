import mongoose from 'mongoose';

const remarkSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  remark_text: { type: String, required: true },
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Remark', remarkSchema);
