import mongoose from 'mongoose';

const maidSchema = new mongoose.Schema({
  phoneNumber: String,
  location: { type: { type: String }, coordinates: [Number] },
});

maidSchema.index({ location: '2dsphere' });
export const Maid = mongoose.model('Maid', maidSchema);

