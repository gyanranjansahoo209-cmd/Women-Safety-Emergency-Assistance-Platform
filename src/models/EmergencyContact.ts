import mongoose, { Schema } from 'mongoose';

const EmergencyContactSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true },
    email: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.EmergencyContact || mongoose.model('EmergencyContact', EmergencyContactSchema);
