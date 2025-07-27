const analyticsRoutes = `
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Group = require('../models/Group');
const Request = require('../models/Request');
const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // User's group participation
    const userGroups = await Group.find({
      $or: [
        { creator: req.user.userId },
        { 'members.user': req.user.userId }
      ]
    });
    
    // Calculate savings
    let totalSavings = 0;
    userGroups.forEach(group => {
      const userMember = group.members.find(m => m.user.toString() === req.user.userId.toString());
      if (userMember) {
        totalSavings += group.savings * userMember.quantityNeeded;
      }
    });
    
    // Recent activity
    const recentRequests = await Request.find({ requester: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Market trends (mock data for demo)
    const marketTrends = [
      { product: 'Rice', trend: 'down', percentage: -3.2 },
      { product: 'Tomatoes', trend: 'up', percentage: 5.1 },
      { product: 'Oil', trend: 'stable', percentage: 0.8 }
    ];
    
    res.json({
      success: true,
      data: {
        stats: {
          totalSavings,
          activeGroups: userGroups.filter(g => g.status === 'active').length,
          completedOrders: userGroups.filter(g => g.status === 'completed').length,
          successRate: userGroups.length > 0 ? Math.round((userGroups.filter(g => g.status === 'completed').length / userGroups.length) * 100) : 0
        },
        recentActivity: {
          groups: userGroups.slice(0, 5),
          requests: recentRequests
        },
        marketTrends,
        aiInsights: {
          recommendations: user.aiProfile.purchaseHistory.length,
          behaviorScore: user.aiProfile.behaviorScore,
          preferredCategories: user.preferences.categories
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

// Get market insights
router.get('/market-insights', auth, async (req, res) => {
  try {
    const { category, timeframe = '30d' } = req.query;
    
    // Mock market insights (in real app, this would come from market data API)
    const insights = {
      priceHistory: [
        { date: '2024-01-01', price: 45 },
        { date: '2024-01-15', price: 43 },
        { date: '2024-02-01', price: 47 },
        { date: '2024-02-15', price: 45 }
      ],
      demandForecast: {
        nextWeek: 'high',
        nextMonth: 'medium',
        seasonal: 'Demand typically increases during festival season'
      },
      costSavingOpportunities: [
        {
          product: 'Basmati Rice',
          potentialSaving: 12,
          reason: 'Group buying available with 15% discount'
        },
        {
          product: 'Cooking Oil',
          potentialSaving: 8,
          reason: 'Bulk purchase from verified supplier'
        }
      ]
    };
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get market insights',
      error: error.message
    });
  }
});

module.exports = router;
`;