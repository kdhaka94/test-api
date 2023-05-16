import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phoneNumber: String,
  location: { type: { type: String }, coordinates: [Number] },
});
export const User = mongoose.model('User', userSchema);

