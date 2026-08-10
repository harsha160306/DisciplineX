import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Department', departmentSchema);
