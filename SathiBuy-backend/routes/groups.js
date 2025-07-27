const groupRoutes = `
const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const router = express.Router();

// Get all active groups with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { category, location, status, search, page = 1, limit = 10 } = req.query;
    
    let query = { status: 'active' };
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const groups = await Group.find(query)
      .populate('creator', 'name profile.businessName')
      .populate('members.user', 'name profile.businessName')
      .populate('supplier', 'name ratings.overall')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get AI-powered recommendations for the user
    const recommendations = await aiService.getGroupRecommendations(req.user.userId, groups);

    res.json({
      success: true,
      data: {
        groups,
        recommendations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(await Group.countDocuments(query) / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups',
      error: error.message
    });
  }
});

// Create new group
router.post('/', auth, [
  body('productName').trim().isLength({ min: 2 }),
  body('category').isIn(['Grains & Cereals', 'Vegetables', 'Fruits', 'Spices', 'Oil & Ghee', 'Dairy Products', 'Other']),
  body('targetQuantity').isNumeric().isFloat({ min: 1 }),
  body('pricePerUnit').isNumeric().isFloat({ min: 0.01 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      productName,
      category,
      targetQuantity,
      pricePerUnit,
      marketPrice,
      deliveryDate,
      deliveryLocation
    } = req.body;

    // Calculate savings
    const savings = marketPrice - pricePerUnit;

    // Get AI metrics for the group
    const aiMetrics = await aiService.calculateGroupMetrics({
      productName,
      category,
      targetQuantity,
      pricePerUnit,
      marketPrice,
      location: deliveryLocation
    });

    const group = new Group({
      title: \`\${productName} - \${targetQuantity}kg\`,
      productName,
      category,
      targetQuantity,
      pricePerUnit,
      marketPrice,
      savings,
      creator: req.user.userId,
      deliveryDetails: {
        expectedDate: deliveryDate,
        location: deliveryLocation
      },
      aiMetrics
    });

    await group.save();
    await group.populate('creator', 'name profile.businessName');

    // Update user stats
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'stats.groupsJoined': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: error.message
    });
  }
});

// Join a group
router.post('/:id/join', auth, [
  body('quantity').isNumeric().isFloat({ min: 0.1 })
], async (req, res) => {
  try {
    const { quantity } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Group is not active'
      });
    }

    // Check if user already joined
    const existingMember = group.members.find(m => 
      m.user.toString() === req.user.userId.toString()
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this group'
      });
    }

    // Check if adding this quantity exceeds target
    if (group.currentQuantity + quantity > group.targetQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantity exceeds group target'
      });
    }

    // Add member to group
    group.addMember(req.user.userId, quantity);
    await group.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 
        'stats.groupsJoined': 1,
        'stats.totalSavings': group.savings * quantity
      }
    });

    // Add to user's AI purchase history
    const user = await User.findById(req.user.userId);
    user.aiProfile.purchaseHistory.push({
      product: group.productName,
      category: group.category,
      quantity,
      price: group.pricePerUnit,
      date: new Date()
    });
    await user.save();

    await group.populate('members.user', 'name profile.businessName');

    res.json({
      success: true,
      message: 'Successfully joined the group',
      data: {
        group,
        savings: group.savings * quantity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join group',
      error: error.message
    });
  }
});

// Get group details
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name profile')
      .populate('members.user', 'name profile')
      .populate('supplier', 'name ratings contactPerson');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group details',
      error: error.message
    });
  }
});

// Leave a group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const memberIndex = group.members.findIndex(m => 
      m.user.toString() === req.user.userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    const member = group.members[memberIndex];
    group.currentQuantity -= member.quantityNeeded;
    group.members[memberIndex].status = 'left';
    group.updateCompletionPercentage();
    await group.save();

    res.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to leave group',
      error: error.message
    });
  }
});

module.exports = router;
`;