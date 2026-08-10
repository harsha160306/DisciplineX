import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  setting_key: { type: String, required: true, unique: true },
  setting_value: { type: String, default: '' },
});

export default mongoose.model('SystemSetting', systemSettingSchema);
