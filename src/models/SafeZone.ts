import mongoose, { Schema } from 'mongoose';

const SafeZoneSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    type: {
      type: String,
      enum: ['POLICE', 'HOSPITAL', 'COMMUNITY_CENTER', 'SAFE_HOUSE'],
      required: true,
    },
    contactNumber: { type: String },
  },
  { timestamps: true }
);

SafeZoneSchema.index({ location: '2dsphere' });

export default mongoose.models.SafeZone || mongoose.model('SafeZone', SafeZoneSchema);
