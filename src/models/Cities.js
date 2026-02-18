const { Schema, model, Types } = require('mongoose');

const citySchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    slug: {
      type: String,
      required: true,
      unique: true
    },

    country: {
      type: Types.ObjectId,   // ← ТУК използваш Types
      ref: "Country",
      required: true
    },

    short_description: {
      type: String,
      required: true
    },

    image_url: {
      type: String,
      required: true
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  { timestamps: true }
);

citySchema.index({ location: "2dsphere" });

const City = model("City", citySchema);

module.exports = { City };
