const chatSchema = `
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      intent: String,
      confidence: Number,
      entities: [mongoose.Schema.Types.Mixed],
      context: mongoose.Schema.Types.Mixed
    }
  }],
  context: {
    activeGroups: [mongoose.Schema.Types.ObjectId],
    recentRequests: [mongoose.Schema.Types.ObjectId],
    userPreferences: mongoose.Schema.Types.Mixed,
    conversationState: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);
`;