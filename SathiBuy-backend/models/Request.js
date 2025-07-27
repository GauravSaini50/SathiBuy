const requestSchema = `
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'kg'
  },
  expectedDelivery: Date,
  maxPrice: Number,
  description: String,
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: ['open', 'matched', 'completed', 'cancelled'],
    default: 'open'
  },
  matchedGroups: [{
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    matchScore: Number,
    reason: String
  }],
  aiSuggestions: [{
    type: {
      type: String,
      enum: ['price_optimization', 'timing', 'alternative', 'supplier']
    },
    message: String,
    data: mongoose.Schema.Types.Mixed,
    priority: {
      type: Number,
      default: 1
    }
  }],
  responses: [{
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    priceQuote: Number,
    deliveryDate: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
`;
