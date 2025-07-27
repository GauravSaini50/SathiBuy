import express from 'express';
import { body, validationResult } from 'express-validator';

import Request from '../models/Request.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// Create new request
router.post(
  '/',
  auth,
  [
    body('productName').trim().isLength({ min: 2 }),
    body('category').notEmpty(),
    body('quantity').isNumeric().isFloat({ min: 0.1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const requestData = {
        ...req.body,
        requester: req.user.userId
      };

      const request = new Request(requestData);

      // Generate AI suggestions
      const suggestions = await aiService.generateSuggestions({
        user: await User.findById(req.user.userId),
        productName: req.body.productName,
        category: req.body.category,
        quantity: req.body.quantity,
        budget: req.body.maxPrice
      });

      request.aiSuggestions = suggestions;
      await request.save();

      // Optional smart matching logic (placeholder)
      setTimeout(async () => {
        console.log('🔍 Smart match triggered for request:', request._id);
        // You can implement match logic here
      }, 2000);

      res.status(201).json({
        success: true,
        message: 'Request created successfully',
        request
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

export default router;