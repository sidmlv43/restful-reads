const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    images: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: [
        {
          validator: (value) => !value || value.length <= 5,
          message: "A book can have up to 5 images",
        },
        {
          validator: (value) =>
            !value ||
            value.every(
              (url) => typeof url === "string" && url.trim().length > 0,
            ),
          message: "Each image must be a non-empty string",
        },
      ],
    },
    author: { type: String, required: true, trim: true },
    genre: { type: String, trim: true },
    price: { type: Number, required: true },
    ratingsCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Book", BookSchema);
