import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  register_number: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  course: { type: String, required: true },
  department: { type: String, required: true },
  academic_year: { type: String, required: true },
  validity: { type: String, required: true },
  dob: { type: String, default: null },
  blood_group: { type: String, default: null },
  address: { type: String, default: null },
  section: { type: String, required: true },
  semester: { type: String, required: true },
  email: { type: String, default: null },
  phone: { type: String, default: null },
  photo_url: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Student', studentSchema);
