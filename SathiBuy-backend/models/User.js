const userSchema = `
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['vendor', 'supplier', 'admin'],
    default: 'vendor'
  },
  profile: {
    businessName: String,
    businessType: String,
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
    gstNumber: String,
    panNumber: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  preferences: {
    categories: [String],
    maxDeliveryDistance: {
      type: Number,
      default: 10
    },
    preferredSuppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalSavings: { type: Number, default: 0 },
    groupsJoined: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  aiProfile: {
    purchaseHistory: [{
      product: String,
      category: String,
      quantity: Number,
      price: Number,
      date: Date
    }],
    preferences: {
      organic: Boolean,
      fastDelivery: Boolean,
      bulkDiscount: Boolean,
      localSuppliers: Boolean
    },
    behaviorScore: { type: Number, default: 50 },
    lastActivity: Date
  },
  refreshToken: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
`;