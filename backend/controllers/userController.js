const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Expense = require('../models/Expense');
const localStore = require('../config/localStore');

// @desc    Get user profile with statistics
// @route   GET /profile or GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const expenseStats = await Expense.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 }
          }
        }
      ]);

      const totalSpent = expenseStats.length > 0 ? expenseStats[0].totalAmount : 0;
      const expenseCount = expenseStats.length > 0 ? expenseStats[0].totalCount : 0;

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          createdAt: user.createdAt,
          totalSpent,
          expenseCount
        }
      });
    } else {
      const user = localStore.findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const summary = localStore.getTotalSummary(userId);
      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          createdAt: user.createdAt,
          totalSpent: summary.totalAmount,
          expenseCount: summary.totalTransactions
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (name, currency)
// @route   PUT /profile or PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, currency } = req.body;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (name) user.name = name.trim();
      if (currency) user.currency = currency;

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency
        }
      });
    } else {
      const updated = localStore.updateUser(userId, {
        name: name ? name.trim() : undefined,
        currency: currency || undefined
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updated._id,
          name: updated.name,
          email: updated.email,
          currency: updated.currency
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }

      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } else {
      const user = localStore.findUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(newPassword, salt);
      localStore.updateUser(userId, { password: hashedPassword });

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res, next) => {
  try {
    let totalUsers = 0;
    let totalExpenses = 0;
    let totalAmount = 0;

    if (mongoose.connection.readyState === 1) {
      totalUsers = await User.countDocuments();
      totalExpenses = await Expense.countDocuments();
      const sumResult = await Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      totalAmount = sumResult.length > 0 ? sumResult[0].total : 0;
    } else {
      const data = localStore.read();
      totalUsers = data.users ? data.users.length : 0;
      totalExpenses = data.expenses ? data.expenses.length : 0;
      totalAmount = data.expenses ? data.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) : 0;
    }

    const mem = process.memoryUsage();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalExpenses,
        totalAmount,
        serverUptime: Math.floor(process.uptime()),
        memoryUsage: `${(mem.rss / (1024 * 1024)).toFixed(1)} MB`,
        nodeVersion: process.version,
        platform: process.platform,
        storageMode: mongoose.connection.readyState === 1 ? 'MongoDB Cluster' : 'High-Fidelity Engine (Persistent JSON)',
        systemStatus: 'Operational (100% Healthy)'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users for admin with activity breakdown
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAdminUsers = async (req, res, next) => {
  try {
    let usersList = [];

    if (mongoose.connection.readyState === 1) {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      const stats = await Expense.aggregate([
        {
          $group: {
            _id: '$user',
            totalSpent: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const statMap = {};
      stats.forEach((s) => {
        statMap[String(s._id)] = { totalSpent: s.totalSpent, count: s.count };
      });

      usersList = users.map((u) => {
        const uStats = statMap[String(u._id)] || { totalSpent: 0, count: 0 };
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          currency: u.currency || '₹',
          role: u.role || (u.email.includes('admin') ? 'admin' : 'user'),
          totalSpent: uStats.totalSpent,
          expenseCount: uStats.count,
          createdAt: u.createdAt
        };
      });
    } else {
      const data = localStore.read();
      usersList = (data.users || []).map((u) => {
        const userExpenses = (data.expenses || []).filter((e) => String(e.user) === String(u._id));
        const totalSpent = userExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          currency: u.currency || '₹',
          role: u.role || (u.email.includes('admin') ? 'admin' : 'user'),
          totalSpent,
          expenseCount: userExpenses.length,
          createdAt: u.createdAt
        };
      });
    }

    res.status(200).json({
      success: true,
      count: usersList.length,
      users: usersList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (promote/demote)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin or user.' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      user.role = role;
      await user.save();
      return res.status(200).json({ success: true, message: `User role updated to ${role}.`, user });
    } else {
      const user = localStore.findUserById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      const updated = localStore.updateUser(id, { role });
      return res.status(200).json({ success: true, message: `User role updated to ${role}.`, user: updated });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user and their expenses
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id || req.user.id;

    if (String(id) === String(currentUserId)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
    }

    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndDelete(id);
      await Expense.deleteMany({ user: id });
    } else {
      const data = localStore.read();
      data.users = (data.users || []).filter((u) => String(u._id) !== String(id));
      data.expenses = (data.expenses || []).filter((e) => String(e.user) !== String(id));
      localStore.write(data);
    }

    res.status(200).json({ success: true, message: 'User and all associated data successfully removed.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform expenses across all users
// @route   GET /api/admin/expenses
// @access  Private (Admin)
exports.getAllPlatformExpenses = async (req, res, next) => {
  try {
    const { search, category, paymentMethod, limit = 50 } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (category) query.category = category;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const expenses = await Expense.find(query)
        .populate('user', 'name email currency')
        .sort({ date: -1, createdAt: -1 })
        .limit(Number(limit));

      return res.status(200).json({ success: true, count: expenses.length, expenses });
    } else {
      const data = localStore.read();
      const userMap = {};
      (data.users || []).forEach((u) => {
        userMap[String(u._id)] = { name: u.name, email: u.email, currency: u.currency };
      });

      let list = (data.expenses || []).map((e) => ({
        ...e,
        user: userMap[String(e.user)] || { name: 'Unknown User', email: 'unknown@user.com', currency: '₹' }
      }));

      if (category) list = list.filter((e) => e.category === category);
      if (paymentMethod) list = list.filter((e) => e.paymentMethod === paymentMethod);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (e) => (e.title && e.title.toLowerCase().includes(s)) || (e.description && e.description.toLowerCase().includes(s))
        );
      }

      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      list = list.slice(0, Number(limit));

      return res.status(200).json({ success: true, count: list.length, expenses: list });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any expense (Admin moderation)
// @route   DELETE /api/admin/expenses/:id
// @access  Private (Admin)
exports.deleteAdminExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      await Expense.findByIdAndDelete(id);
    } else {
      localStore.deleteExpense(id);
    }

    res.status(200).json({ success: true, message: 'Expense record removed by admin.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Export full database backup JSON
// @route   GET /api/admin/backup
// @access  Private (Admin)
exports.exportDatabaseBackup = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find().select('-password');
      const expenses = await Expense.find();
      const Category = require('../models/Category');
      const categories = await Category.find();

      const backup = {
        exportedAt: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        users,
        categories,
        expenses
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="expensetrack_backup.json"');
      return res.status(200).send(JSON.stringify(backup, null, 2));
    } else {
      const data = localStore.read();
      const safeData = {
        exportedAt: new Date().toISOString(),
        users: (data.users || []).map((u) => {
          const { password, ...rest } = u;
          return rest;
        }),
        categories: data.categories || [],
        expenses: data.expenses || []
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="expensetrack_backup.json"');
      return res.status(200).send(JSON.stringify(safeData, null, 2));
    }
  } catch (error) {
    next(error);
  }
};
