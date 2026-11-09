const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getTotalExpense,
  getMonthlyExpenses,
  getCategoryExpenses
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

// All expense routes require authentication
router.use(protect);

// Analytics endpoints (must be before :id routes)
router.get('/total', getTotalExpense);
router.get('/monthly', getMonthlyExpenses);
router.get('/category', getCategoryExpenses);

// CRUD endpoints
router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .get(getExpenseById)
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
