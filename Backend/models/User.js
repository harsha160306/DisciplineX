import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, default: '' },
  phone: { type: String, default: '' },
  employee_id: { type: String, default: '' },
  email: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  designation: { type: String, default: 'Discipline Incharge' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('User', userSchema);
