const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const localStore = require('../config/localStore');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretjwtkey_mcademo_2026_expense_tracker'
      );

      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        const u = localStore.findUserById(decoded.id);
        if (u) {
          req.user = {
            _id: u._id,
            id: u._id,
            name: u.name,
            email: u.email,
            currency: u.currency,
            role: u.role || (u.email && u.email.includes('admin') ? 'admin' : 'user'),
            createdAt: u.createdAt
          };
        }
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.'
        });
      }

      // Ensure req.user has a role property
      if (!req.user.role) {
        req.user.role = req.user.email && req.user.email.includes('admin') ? 'admin' : 'user';
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid or expired.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided.'
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access restricted: Administrator credentials required.'
  });
};

module.exports = { protect, adminOnly };
