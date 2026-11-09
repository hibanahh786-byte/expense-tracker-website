const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const localStore = require('../config/localStore');

// @desc    Get all expenses with search, filtering, and pagination
// @route   GET /expenses or GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res, next) => {
  try {
    const { category, search, startDate, endDate, sort, page, limit } = req.query;
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const query = { user: userId };

      if (category && category !== 'All' && category !== '') {
        query.category = category;
      }

      if (search && search.trim() !== '') {
        query.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.date.$lte = end;
        }
      }

      let sortOptions = { date: -1, createdAt: -1 };
      if (sort === 'date_asc') sortOptions = { date: 1 };
      else if (sort === 'date_desc') sortOptions = { date: -1 };
      else if (sort === 'amount_asc') sortOptions = { amount: 1 };
      else if (sort === 'amount_desc') sortOptions = { amount: -1 };

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 50;
      const skip = (pageNum - 1) * limitNum;

      const total = await Expense.countDocuments(query);
      const expenses = await Expense.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);

      return res.status(200).json({
        success: true,
        count: expenses.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        expenses
      });
    } else {
      const result = localStore.getExpenses(userId, {
        category,
        search,
        startDate,
        endDate,
        sort,
        page,
        limit
      });
      return res.status(200).json({
        success: true,
        ...result
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense by ID
// @route   GET /expense/:id
// @access  Private
exports.getExpenseById = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const expense = await Expense.findOne({ _id: id, user: userId });
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      return res.status(200).json({ success: true, expense });
    } else {
      const expense = localStore.getExpenseById(id, userId);
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      return res.status(200).json({ success: true, expense });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /expense or POST /api/expense
// @access  Private
exports.createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, description, date, paymentMethod } = req.body;
    const userId = req.user._id || req.user.id;

    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and amount.'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const expense = await Expense.create({
        user: userId,
        title: title.trim(),
        amount: Number(amount),
        category: category || 'Others',
        description: description ? description.trim() : '',
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || 'Cash'
      });

      return res.status(201).json({
        success: true,
        message: 'Expense added successfully',
        expense
      });
    } else {
      const expense = localStore.createExpense({
        user: userId,
        title: title.trim(),
        amount: Number(amount),
        category: category || 'Others',
        description: description ? description.trim() : '',
        date,
        paymentMethod: paymentMethod || 'Cash'
      });

      return res.status(201).json({
        success: true,
        message: 'Expense added successfully',
        expense
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing expense
// @route   PUT /expense/:id or PUT /api/expense/:id
// @access  Private
exports.updateExpense = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { title, amount, category, description, date, paymentMethod } = req.body;

    if (mongoose.connection.readyState === 1) {
      let expense = await Expense.findOne({ _id: id, user: userId });
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }

      expense.title = title !== undefined ? title.trim() : expense.title;
      expense.amount = amount !== undefined ? Number(amount) : expense.amount;
      expense.category = category !== undefined ? category : expense.category;
      expense.description = description !== undefined ? description.trim() : expense.description;
      expense.date = date !== undefined ? new Date(date) : expense.date;
      expense.paymentMethod = paymentMethod !== undefined ? paymentMethod : expense.paymentMethod;

      await expense.save();
      return res.status(200).json({ success: true, message: 'Expense updated successfully', expense });
    } else {
      const updated = localStore.updateExpense(id, userId, {
        title,
        amount,
        category,
        description,
        date,
        paymentMethod
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }

      return res.status(200).json({ success: true, message: 'Expense updated successfully', expense: updated });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /expense/:id or DELETE /api/expense/:id
// @access  Private
exports.deleteExpense = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const expense = await Expense.findOneAndDelete({ _id: id, user: userId });
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      return res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } else {
      const success = localStore.deleteExpense(id, userId);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }
      return res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense summary (Total, Today, This Month, Count)
// @route   GET /expense/total or GET /api/expense/total
// @access  Private
exports.getTotalExpense = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (mongoose.connection.readyState === 1) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const now = new Date();

      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const totalAgg = await Expense.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, totalCount: { $sum: 1 } } }
      ]);

      const todayAgg = await Expense.aggregate([
        { $match: { user: userObjectId, date: { $gte: startOfToday, $lte: endOfToday } } },
        { $group: { _id: null, todayAmount: { $sum: '$amount' } } }
      ]);

      const monthlyAgg = await Expense.aggregate([
        { $match: { user: userObjectId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, monthAmount: { $sum: '$amount' } } }
      ]);

      const recentExpenses = await Expense.find({ user: userObjectId })
        .sort({ date: -1, createdAt: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        data: {
          totalAmount: totalAgg.length > 0 ? totalAgg[0].totalAmount : 0,
          todayAmount: todayAgg.length > 0 ? todayAgg[0].todayAmount : 0,
          monthlyAmount: monthlyAgg.length > 0 ? monthlyAgg[0].monthAmount : 0,
          totalTransactions: totalAgg.length > 0 ? totalAgg[0].totalCount : 0,
          recentExpenses
        }
      });
    } else {
      const summary = localStore.getTotalSummary(userId);
      return res.status(200).json({
        success: true,
        data: summary
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly expense breakdown
// @route   GET /expense/monthly or GET /api/expense/monthly
// @access  Private
exports.getMonthlyExpenses = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { year } = req.query;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    if (mongoose.connection.readyState === 1) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const startOfYear = new Date(targetYear, 0, 1);
      const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

      const monthlyBreakdown = await Expense.aggregate([
        { $match: { user: userObjectId, date: { $gte: startOfYear, $lte: endOfYear } } },
        { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } }
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = monthNames.map((name, index) => {
        const monthNum = index + 1;
        const found = monthlyBreakdown.find((m) => m._id === monthNum);
        return {
          month: name,
          monthIndex: monthNum,
          year: targetYear,
          total: found ? found.total : 0,
          count: found ? found.count : 0
        };
      });

      return res.status(200).json({ success: true, year: targetYear, data: monthlyData });
    } else {
      const monthlyData = localStore.getMonthlyBreakdown(userId, targetYear);
      return res.status(200).json({ success: true, year: targetYear, data: monthlyData });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get category-wise expense breakdown
// @route   GET /expense/category or GET /api/expense/category
// @access  Private
exports.getCategoryExpenses = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { startDate, endDate, month, year } = req.query;

    if (mongoose.connection.readyState === 1) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const matchQuery = { user: userObjectId };

      if (month && year) {
        const m = parseInt(month, 10) - 1;
        const y = parseInt(year, 10);
        matchQuery.date = {
          $gte: new Date(y, m, 1),
          $lte: new Date(y, m + 1, 0, 23, 59, 59, 999)
        };
      } else if (startDate || endDate) {
        matchQuery.date = {};
        if (startDate) matchQuery.date.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchQuery.date.$lte = end;
        }
      }

      const categoryBreakdown = await Expense.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } }
      ]);

      const grandTotal = categoryBreakdown.reduce((acc, curr) => acc + curr.totalAmount, 0);

      const categoriesWithPercentages = categoryBreakdown.map((item) => ({
        category: item._id,
        totalAmount: item.totalAmount,
        count: item.count,
        percentage: grandTotal > 0 ? ((item.totalAmount / grandTotal) * 100).toFixed(1) : 0
      }));

      return res.status(200).json({ success: true, grandTotal, data: categoriesWithPercentages });
    } else {
      const result = localStore.getCategoryBreakdown(userId, { month, year, startDate, endDate });
      return res.status(200).json({ success: true, ...result });
    }
  } catch (error) {
    next(error);
  }
};
