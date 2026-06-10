import mongoose, { Schema } from 'mongoose';

const VolunteerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationRequested: { type: Boolean, default: false },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // [lng, lat]
      },
    },
  },
  { timestamps: true }
);

VolunteerProfileSchema.index({ currentLocation: '2dsphere' });

export default mongoose.models.VolunteerProfile || mongoose.model('VolunteerProfile', VolunteerProfileSchema);
