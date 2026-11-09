const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const localStore = require('../config/localStore');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretjwtkey_mcademo_2026_expense_tracker',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// @desc    Register a new user
// @route   POST /register or POST /api/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    const emailNormalized = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      // MongoDB
      const userExists = await User.findOne({ email: emailNormalized });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists.'
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: emailNormalized,
        password,
        currency: currency || '₹'
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          role: user.role || 'user'
        }
      });
    } else {
      // Local Store Fallback
      const userExists = localStore.findUserByEmail(emailNormalized);
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists.'
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const user = localStore.createUser({
        name: name.trim(),
        email: emailNormalized,
        password: hashedPassword,
        currency: currency || '₹'
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          role: user.role || 'user'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /login or POST /api/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const emailNormalized = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      // MongoDB
      const query = (emailNormalized === 'admin')
        ? { $or: [{ email: 'admin' }, { email: 'admin@expensetrack.app' }, { role: 'admin' }] }
        : { email: emailNormalized };
      const user = await User.findOne(query).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          role: user.role || (user.email && user.email.includes('admin') ? 'admin' : 'user')
        }
      });
    } else {
      // Local Store Fallback
      const user = localStore.findUserByEmail(emailNormalized);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          role: user.role || (user.email && user.email.includes('admin') ? 'admin' : 'user')
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        currency: req.user.currency,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
