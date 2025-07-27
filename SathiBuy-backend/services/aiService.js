const aiService = `
const User = require('../models/User');
const Group = require('../models/Group');
const Request = require('../models/Request');
const Supplier = require('../models/Supplier');

class AIService {
  // Generate personalized recommendations
  async getPersonalizedRecommendations(user, availableGroups) {
    const recommendations = [];
    
    // Analyze user's purchase history
    const userCategories = user.aiProfile.purchaseHistory.map(p => p.category);
    const categoryFrequency = {};
    
    userCategories.forEach(cat => {
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
    });
    
    // Find groups matching user preferences
    for (const group of availableGroups) {
      let score = 0;
      
      // Category preference scoring
      if (categoryFrequency[group.category]) {
        score += categoryFrequency[group.category] * 10;
      }
      
      // Price optimization scoring
      if (group.savings > 0) {
        score += group.savings * 2;
      }
      
      // Completion percentage scoring (prefer groups closer to completion)
      score += group.completionPercentage * 0.5;
      
      // Location-based scoring (mock implementation)
      if (user.profile.address && group.deliveryDetails.location) {
        score += 20; // Assume good location match
      }
      
      // AI metrics scoring
      if (group.aiMetrics) {
        score += (group.aiMetrics.demandScore || 50) * 0.3;
        score += (group.aiMetrics.priceOptimizationScore || 50) * 0.3;
      }
      
      if (score > 30) {
        recommendations.push({
          group: group._id,
          score,
          reasons: this.generateRecommendationReasons(group, user, score),
          priority: score > 70 ? 'high' : score > 50 ? 'medium' : 'low'
        });
      }
    }
    
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
  }
  
  // Generate reasons for recommendations
  generateRecommendationReasons(group, user, score) {
    const reasons = [];
    
    if (group.savings > 10) {
      reasons.push(\`Save ₹\${group.savings}/kg compared to market price\`);
    }
    
    if (group.completionPercentage > 70) {
      reasons.push('Group is almost full - join now to secure your order');
    }
    
    const userBoughtSimilar = user.aiProfile.purchaseHistory.some(p => 
      p.product.toLowerCase().includes(group.productName.toLowerCase()) ||
      p.category === group.category
    );
    
    if (userBoughtSimilar) {
      reasons.push('Based on your purchase history');
    }
    
    if (user.aiProfile.preferences.bulkDiscount) {
      reasons.push('Matches your bulk discount preference');
    }
    
    return reasons;
  }
  
  // Predict pricing for products
  async predictPricing({ productName, category, quantity, location }) {
    // Mock AI prediction logic (in real app, use ML models)
    const basePrice = this.getBasePriceForProduct(productName, category);
    
    // Quantity-based pricing
    let discountPercentage = 0;
    if (quantity > 50) discountPercentage = 15;
    else if (quantity > 20) discountPercentage = 10;
    else if (quantity > 10) discountPercentage = 5;
    
    const discountedPrice = basePrice * (1 - discountPercentage / 100);
    
    // Seasonal and market factors
    const seasonalFactor = this.getSeasonalFactor(category);
    const marketPrice = discountedPrice * seasonalFactor;
    
    return {
      predictedPrice: Math.round(marketPrice * 100) / 100,
      confidence: 0.85,
      factors: {
        basePrice,
        quantityDiscount: discountPercentage,
        seasonalImpact: (seasonalFactor - 1) * 100,
        marketTrend: 'stable'
      },
      recommendations: [
        {
          action: 'wait',
          reason: 'Prices expected to drop by 3% next week',
          impact: -1.5
        },
        {
          action: 'buy_now',
          reason: 'Current group offers 12% additional discount',
          impact: -12
        }
      ]
    };
  }
  
  // Get demand forecast
  async getDemandForecast({ productName, category, timeframe }) {
    // Mock forecast (in real app, analyze historical data)
    const forecast = {
      '7d': { demand: 'high', confidence: 0.8, change: '+15%' },
      '30d': { demand: 'medium', confidence: 0.7, change: '+5%' },
      '90d': { demand: 'low', confidence: 0.6, change: '-10%' }
    };
    
    return {
      timeframe,
      forecast: forecast[timeframe] || forecast['30d'],
      factors: [
        'Seasonal festival demand increase',
        'Local market supply constraints',
        'Weather impact on transportation'
      ]
    };
  }
  
  // Find smart matches for requests
  async findSmartMatches(request) {
    const activeGroups = await Group.find({
      status: 'active',
      category: request.category
    }).populate('creator members.user supplier');
    
    const matches = [];
    
    for (const group of activeGroups) {
      let matchScore = 0;
      const reasons = [];
      
      // Product similarity
      if (group.productName.toLowerCase().includes(request.productName.toLowerCase()) ||
          request.productName.toLowerCase().includes(group.productName.toLowerCase())) {
        matchScore += 40;
        reasons.push('Exact product match');
      } else if (group.category === request.category) {
        matchScore += 20;
        reasons.push('Same category');
      }
      
      // Quantity compatibility
      const remainingCapacity = group.targetQuantity - group.currentQuantity;
      if (request.quantity <= remainingCapacity) {
        matchScore += 30;
        reasons.push('Sufficient capacity available');
      } else if (request.quantity <= remainingCapacity * 1.2) {
        matchScore += 15;
        reasons.push('Near capacity match');
      }
      
      // Price compatibility
      if (!request.maxPrice || group.pricePerUnit <= request.maxPrice) {
        matchScore += 20;
        reasons.push('Within budget');
      }
      
      // Location proximity (mock)
      matchScore += 10;
      reasons.push('Good location match');
      
      if (matchScore >= 50) {
        matches.push({
          group: group._id,
          matchScore,
          reasons,
          estimatedSavings: group.savings * request.quantity
        });
      }
    }
    
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }
  
  // Generate AI chat response
  async generateChatResponse(message, context, userId) {
    const user = await User.findById(userId);
    const lowerMessage = message.toLowerCase();
    
    let response = {
      content: '',
      metadata: {
        intent: 'unknown',
        confidence: 0.5,
        entities: [],
        context: context || {}
      }
    };
    
    // Intent classification (simple keyword matching for demo)
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('save')) {
      response.metadata.intent = 'price_inquiry';
      response.content = this.generatePriceResponse(user);
    } else if (lowerMessage.includes('group') || lowerMessage.includes('join')) {
      response.metadata.intent = 'group_inquiry';
      response.content = await this.generateGroupResponse(user);
    } else if (lowerMessage.includes('delivery') || lowerMessage.includes('when')) {
      response.metadata.intent = 'delivery_inquiry';
      response.content = this.generateDeliveryResponse();
    } else if (lowerMessage.includes('supplier') || lowerMessage.includes('vendor')) {
      response.metadata.intent = 'supplier_inquiry';
      response.content = await this.generateSupplierResponse();
    } else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      response.metadata.intent = 'recommendation_request';
      response.content = await this.generateRecommendationResponse(user);
    } else {
      response.metadata.intent = 'general';
      response.content = 'I can help you with group buying opportunities, price predictions, delivery information, and supplier details. What would you like to know more about?';
    }
    
    response.metadata.confidence = 0.85;
    return response;
  }
  
  // Generate specific response types
  generatePriceResponse(user) {
    const recentPurchase = user.aiProfile.purchaseHistory[user.aiProfile.purchaseHistory.length - 1];
    if (recentPurchase) {
      return \`Based on your recent purchase of \${recentPurchase.product}, you can save 15-25% through group buying. Current market analysis shows bulk orders save ₹8-15 per kg on average.\`;
    }
    return 'Group buying typically saves 15-30% compared to individual purchases. I can analyze specific products to give you exact savings estimates.';
  }
  
  async generateGroupResponse(user) {
    const activeGroupsCount = await Group.countDocuments({ status: 'active' });
    const userGroups = await Group.countDocuments({
      $or: [
        { creator: user._id },
        { 'members.user': user._id }
      ]
    });
    
    return \`I found \${activeGroupsCount} active groups available. You're currently part of \${userGroups} groups. Top matches for you: Rice (85% full, save ₹12/kg), Tomatoes (45% full, save ₹5/kg), Oil (60% full, save ₹18/L). Would you like me to show details for any of these?\`;
  }
  
  generateDeliveryResponse() {
    return 'Our AI optimizes delivery routes for maximum efficiency. Average delivery time is 24-48 hours for group orders. Orders above ₹500 get free delivery, and we provide real-time tracking once your group reaches the target quantity.';
  }
  
  async generateSupplierResponse() {
    const verifiedSuppliers = await Supplier.countDocuments({ isVerified: true, isActive: true });
    return \`I work with \${verifiedSuppliers}+ verified suppliers across your region. All suppliers are rated 4+ stars with quality guarantees. Current best rates: Rice ₹45/kg, Vegetables ₹25-35/kg, Oil ₹140/L. Would you like supplier details for any specific product?\`;
  }
  
  async generateRecommendationResponse(user) {
    const recommendations = await this.getPersonalizedRecommendations(user, await Group.find({ status: 'active' }));
    
    if (recommendations.length > 0) {
      const top = recommendations[0];
      return \`Based on your profile, I recommend joining the group for \${top.group.productName}. You can save ₹\${top.group.savings * 10} on a 10kg order. This group is \${top.group.completionPercentage}% complete and matches your purchase history.\`;
    }
    
    return 'I\'m analyzing current opportunities based on your preferences. Check back in a few minutes for personalized recommendations!';
  }
  
  // Helper methods
  getBasePriceForProduct(productName, category) {
    const basePrices = {
      'rice': 50,
      'basmati': 65,
      'wheat': 35,
      'tomato': 30,
      'onion': 25,
      'potato': 20,
      'oil': 150,
      'dal': 80
    };
    
    const key = productName.toLowerCase().split(' ')[0];
    return basePrices[key] || 40;
  }
  
  getSeasonalFactor(category) {
    const currentMonth = new Date().getMonth();
    
    // Mock seasonal factors
    if (category === 'Vegetables') {
      return currentMonth >= 3 && currentMonth <= 5 ? 1.2 : 0.9; // Summer premium
    }
    
    if (category === 'Fruits') {
      return currentMonth >= 9 && currentMonth <= 11 ? 0.8 : 1.1; // Harvest season discount
    }
    
    return 1.0; // No seasonal impact
  }
  
  // Calculate group metrics using AI
  async calculateGroupMetrics(groupData) {
    return {
      demandScore: Math.random() * 40 + 60, // 60-100
      priceOptimizationScore: Math.random() * 30 + 70, // 70-100
      deliveryEfficiencyScore: Math.random() * 25 + 75, // 75-100
      memberCompatibilityScore: Math.random() * 20 + 80 // 80-100
    };
  }
  
  // Generate suggestions for requests
  async generateSuggestions({ user, productName, category, quantity, budget }) {
    const suggestions = [];
    
    // Price optimization suggestion
    const priceData = await this.predictPricing({ productName, category, quantity });
    if (budget && priceData.predictedPrice < budget) {
      suggestions.push({
        type: 'price_optimization',
        message: \`Great news! Current market price (₹\${priceData.predictedPrice}/kg) is ₹\${Math.round(budget - priceData.predictedPrice)} below your budget.\`,
        priority: 2,
        data: { savings: budget - priceData.predictedPrice }
      });
    }
    
    // Timing suggestion
    const demandForecast = await this.getDemandForecast({ productName, category, timeframe: '7d' });
    if (demandForecast.forecast.demand === 'high') {
      suggestions.push({
        type: 'timing',
        message: 'High demand expected next week. Consider placing your order now to avoid price increases.',
        priority: 1,
        data: { urgency: 'high' }
      });
    }
    
    // Alternative suggestion
    if (user.aiProfile.preferences.organic && !productName.toLowerCase().includes('organic')) {
      suggestions.push({
        type: 'alternative',
        message: \`Consider organic \${productName} - only ₹2-3/kg more but matches your preference for organic products.\`,
        priority: 3,
        data: { alternative: \`Organic \${productName}\` }
      });
    }
    
    return suggestions.sort((a, b) => a.priority - b.priority);
  }
}

module.exports = new AIService();
`;

console.log('🤖 AI Service Created:');
console.log('  - Personalized Recommendations');
console.log('  - Price Prediction & Forecasting');
console.log('  - Smart Request Matching');
console.log('  - Intelligent Chat Responses');
console.log('  - Market Analytics & Insights');// server.js - Main server file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
