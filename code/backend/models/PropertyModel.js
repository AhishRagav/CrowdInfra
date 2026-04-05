import mongoose from 'mongoose'

// Ensure `propertiesDB` is initialized
const propertySchema = new mongoose.Schema(
  {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords) {
            return coords.length === 2 // Must have exactly [lng, lat]
          },
          message:
            'Coordinates must be an array of two numbers [longitude, latitude].',
        },
      },
    },
    status: {
      type: String,
      enum: ['rented', 'sold', 'up_for_renting'],
      required: true,
    },
  },
  { timestamps: true }
)

// **Create Geospatial Index**
propertySchema.index({ location: '2dsphere' })

export const Property = global.propertiesDB.model('Property', propertySchema)