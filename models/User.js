const mongoose = require("mongoose");
const AddressSchema = require("./Address");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "Customer"], default: "Customer" },
    addresses: [AddressSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
