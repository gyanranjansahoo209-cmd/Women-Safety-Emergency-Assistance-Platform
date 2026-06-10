import mongoose, { Schema } from 'mongoose';

const AlertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'RESOLVED', 'CANCELLED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

AlertSchema.index({ location: '2dsphere' });

export default mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
