const chatRoutes = `
const express = require('express');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const aiService = require('../services/aiService');
const router = express.Router();

// Get chat history
router.get('/history', auth, async (req, res) => {
  try {
    let chat = await Chat.findOne({ user: req.user.userId, isActive: true });
    
    if (!chat) {
      chat = new Chat({
        user: req.user.userId,
        messages: [{
          sender: 'ai',
          content: 'Hello! I\'m your SathiBuy AI assistant. I can help you find group buying opportunities, predict prices, and optimize your purchases. How can I help you today?',
          metadata: {
            intent: 'greeting',
            confidence: 1.0
          }
        }]
      });
      await chat.save();
    }
    
    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: error.message
    });
  }
});

// Send message to AI
router.post('/message', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }
    
    let chat = await Chat.findOne({ user: req.user.userId, isActive: true });
    
    if (!chat) {
      chat = new Chat({ user: req.user.userId });
    }
    
    // Add user message
    chat.messages.push({
      sender: 'user',
      content: message
    });
    
    // Get AI response
    const aiResponse = await aiService.generateChatResponse(message, chat.context, req.user.userId);
    
    // Add AI response
    chat.messages.push({
      sender: 'ai',
      content: aiResponse.content,
      metadata: aiResponse.metadata
    });
    
    // Update context
    chat.context = aiResponse.context;
    
    await chat.save();
    
    res.json({
      success: true,
      data: {
        message: aiResponse.content,
        metadata: aiResponse.metadata
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
});

// Clear chat history
router.delete('/clear', auth, async (req, res) => {
  try {
    await Chat.findOneAndUpdate(
      { user: req.user.userId, isActive: true },
      { isActive: false }
    );
    
    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: error.message
    });
  }
});

module.exports = router;
`;

// routes/analytics.js


console.log('📁 API Routes Created:');
console.log('  - Authentication (register, login, refresh)');
console.log('  - Groups (create, join, leave, list)');
console.log('  - AI Services (recommendations, predictions)');
console.log('  - Chat (AI assistant integration)');
console.log('  - Analytics (dashboard, market insights)');