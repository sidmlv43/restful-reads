const mongoose = require('mongoose');
const AddressSchema = require('./Address');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Customer'], default: 'Customer' },
  addresses: [AddressSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
