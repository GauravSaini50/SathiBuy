const groupSchema = `
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Grains & Cereals', 'Vegetables', 'Fruits', 'Spices', 'Oil & Ghee', 'Dairy Products', 'Other']
  },
  targetQuantity: {
    type: Number,
    required: true
  },
  currentQuantity: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'kg'
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  marketPrice: {
    type: Number,
    required: true
  },
  savings: {
    type: Number,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    quantityNeeded: Number,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'left', 'completed'],
      default: 'active'
    }
  }],
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  deliveryDetails: {
    expectedDate: Date,
    location: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    deliveryType: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'delivery'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'processing'],
    default: 'active'
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  aiMetrics: {
    demandScore: Number,
    priceOptimizationScore: Number,
    deliveryEfficiencyScore: Number,
    memberCompatibilityScore: Number
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  }
}, {
  timestamps: true
});

// Calculate completion percentage
groupSchema.methods.updateCompletionPercentage = function() {
  this.completionPercentage = Math.round((this.currentQuantity / this.targetQuantity) * 100);
  return this.completionPercentage;
};

// Check if group is full
groupSchema.methods.isFull = function() {
  return this.currentQuantity >= this.targetQuantity;
};

// Add member to group
groupSchema.methods.addMember = function(userId, quantity) {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  
  if (existingMember) {
    existingMember.quantityNeeded += quantity;
  } else {
    this.members.push({
      user: userId,
      quantityNeeded: quantity
    });
  }
  
  this.currentQuantity += quantity;
  this.updateCompletionPercentage();
};

module.exports = mongoose.model('Group', groupSchema);
`;