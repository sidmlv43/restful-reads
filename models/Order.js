const mongoose = require('mongoose');
const AddressSchema = require('./Address');

const OrderItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true }
});

const shippingAddressFields = { ...AddressSchema.obj };
delete shippingAddressFields.isDefault;

const ShippingAddressSchema = new mongoose.Schema({
  addressId: { type: mongoose.Schema.Types.ObjectId, required: true },
  ...shippingAddressFields
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  shippingAddress: { type: ShippingAddressSchema, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
