const { Schema, model, Types } = require('mongoose');

const poiSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    city: {
      type: Types.ObjectId,   // ← пак Types
      ref: "City",
      required: true
    },

    short_description: String,

    image_url: String
  },
  { timestamps: true }
);

const POI = model("POI", poiSchema);

module.exports = { POI };
