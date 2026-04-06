import mongoose from 'mongoose'

// Ensure `demandsDB` is initialized before use
const demandSchema = new mongoose.Schema(
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
            return coords.length === 2 // Ensure exactly 2 values
          },
          message:
            'Coordinates must be an array of two numbers [longitude, latitude].',
        },
      },
    },
    category: {
      type: String,
      required: true,
      enum: [
        'hospital',
        'bank',
        'atm',
        'canteen',
        'road',
        'water_supply',
        'electricity',
      ], // Extend as needed
    },
    status: {
      type: String,
      enum: ['fulfilled', 'not_fulfilled'],
      default: 'not_fulfilled',
    },
    up_votes: {
      type: Number,
      default: 0,
      min: 0, // Prevents negative votes
    },
    down_votes: {
      type: Number,
      default: 0,
      min: 0, // Prevents negative votes
    },
  },
  { timestamps: true }
)

// **GeoSpatial Index for Efficient Location-Based Queries**
demandSchema.index({ location: '2dsphere' })

export const Demand = global.demandsDB.model('Demand', demandSchema)