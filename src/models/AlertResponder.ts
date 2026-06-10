import mongoose, { Schema } from 'mongoose';

const AlertResponderSchema = new Schema(
  {
    alertId: { type: Schema.Types.ObjectId, ref: 'Alert', required: true },
    responderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['NOTIFIED', 'ACCEPTED', 'DISPATCHED', 'ARRIVED', 'RESOLVED', 'CANCELLED'],
      default: 'NOTIFIED',
    },
  },
  { timestamps: true }
);

export default mongoose.models.AlertResponder || mongoose.model('AlertResponder', AlertResponderSchema);
