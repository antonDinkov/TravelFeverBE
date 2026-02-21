const { Schema, model } = require('mongoose');

const countrySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },

    slug: {
      type: String,
      required: true,
      unique: true
    },

    code: {
      type: String, // ISO code: BG, FR, IT
      required: true,
      uppercase: true
    },

    short_description: {
      type: String,
      required: true,
    },

    image_url: {
      type: String,
      required: true
    },

    featured_rank: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

const Country = model('Country', countrySchema);

module.exports = { Country };