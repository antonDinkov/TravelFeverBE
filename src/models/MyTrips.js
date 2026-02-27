const { Schema, model, Types } = require('mongoose');

const tripSchema = new Schema(
    {
        type: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
        },

        short_description: {
            type: String,
            required: true,
        },

        image_url: {
            type: String,
            required: true
        },

        image_public_id: {
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
        },

        user: {
            type: Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

tripSchema.index({ location: "2dsphere" });
tripSchema.index({ name: 1, user: 1 }, { unique: true });

const Trip = model('Trip', tripSchema);

module.exports = { Trip };