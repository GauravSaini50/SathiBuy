const supplierSchema = `
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  businessDetails: {
    gstNumber: String,
    panNumber: String,
    tradeLicense: String,
    businessType: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  serviceAreas: [{
    city: String,
    radius: Number // in km
  }],
  categories: [String],
  products: [{
    name: String,
    category: String,
    currentPrice: Number,
    unit: String,
    minimumOrder: Number,
    maxSupply: Number,
    qualityGrade: String,
    certifications: [String]
  }],
  ratings: {
    overall: { type: Number, default: 0 },
    quality: { type: Number, default: 0 },
    delivery: { type: Number, default: 0 },
    pricing: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  performance: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    onTimeDelivery: { type: Number, default: 0 },
    lastActiveDate: Date
  },
  paymentTerms: {
    acceptedMethods: [String],
    creditDays: Number,
    advancePercentage: Number
  },
  aiMetrics: {
    reliabilityScore: { type: Number, default: 50 },
    priceCompetitiveness: { type: Number, default: 50 },
    responseTime: { type: Number, default: 24 }, // in hours
    qualityConsistency: { type: Number, default: 50 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
`;