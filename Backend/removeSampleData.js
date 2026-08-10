import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Remark from './models/Remark.js';

dotenv.config();

const removeSample = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully. Removing test student and remark...');

    const student = await Student.findOne({ register_number: '2024CS202' });
    if (student) {
      await Remark.deleteMany({ student_id: student._id });
      await Student.deleteOne({ _id: student._id });
      console.log('Sample data removed!');
    } else {
      console.log('Sample data not found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

removeSample();
