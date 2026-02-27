const { Schema, model } = require('mongoose');

const tripSchema = new Schema(
  {
    type: {
        type: String,
        required: true
    },
    name: {
      type: String,
      required: true,
      unique: true
    },

    short_description: {
      type: String,
      required: true,
    },

    image_url: {
      type: String,
      required: true
    },
    location_name: {
      type: String,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
      }
    }
  },
  {
    timestamps: true
  }
);

tripSchema.index({ location: "2dsphere" });

const Trip = model('Trip', tripSchema);

module.exports = { Trip };