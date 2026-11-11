const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Controllers for root-level direct routes
const authController = require('./controllers/authController');
const expenseController = require('./controllers/expenseController');
const userController = require('./controllers/userController');

// Controllers & Routes
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const userRoutes = require('./routes/userRoutes');

// Root-Level Endpoints required in specification
app.post('/register', authController.register);
app.post('/login', authController.login);

app.get('/expenses', protect, expenseController.getExpenses);
app.post('/expense', protect, expenseController.createExpense);
app.get('/expense/total', protect, expenseController.getTotalExpense);
app.get('/expense/monthly', protect, expenseController.getMonthlyExpenses);
app.get('/expense/category', protect, expenseController.getCategoryExpenses);
app.get('/expense/:id', protect, expenseController.getExpenseById);
app.put('/expense/:id', protect, expenseController.updateExpense);
app.delete('/expense/:id', protect, expenseController.deleteExpense);

app.get('/profile', protect, userController.getProfile);
app.put('/profile', protect, userController.updateProfile);

// Admin Direct Endpoints
const { adminOnly } = require('./middleware/authMiddleware');
app.get('/api/admin/stats', protect, adminOnly, userController.getAdminStats);
app.get('/api/admin/users', protect, adminOnly, userController.getAdminUsers);
app.put('/api/admin/users/:id/role', protect, adminOnly, userController.updateUserRole);
app.delete('/api/admin/users/:id', protect, adminOnly, userController.deleteUser);
app.get('/api/admin/expenses', protect, adminOnly, userController.getAllPlatformExpenses);
app.delete('/api/admin/expenses/:id', protect, adminOnly, userController.deleteAdminExpense);
app.get('/api/admin/backup', protect, adminOnly, userController.exportDatabaseBackup);

// Standard API Route Mounts (/api/...)
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/users', userRoutes);

// Category list endpoint
const Category = require('./models/Category');
app.get('/api/categories', protect, async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
});

// HTML Page Route Helpers for clean URL access
const sendHtml = (file) => (req, res) => res.sendFile(path.join(__dirname, '../frontend', file));
app.get('/', sendHtml('index.html'));
app.get('/home', sendHtml('index.html'));
app.get('/register.html', sendHtml('register.html'));
app.get('/login.html', sendHtml('login.html'));
app.get('/dashboard.html', sendHtml('dashboard.html'));
app.get('/add-expense.html', sendHtml('add-expense.html'));
app.get('/expenses.html', sendHtml('expenses.html'));
app.get('/edit-expense.html', sendHtml('edit-expense.html'));
app.get('/reports.html', sendHtml('reports.html'));
app.get('/profile.html', sendHtml('profile.html'));
app.get('/admin', sendHtml('admin.html'));
app.get('/admin.html', sendHtml('admin.html'));

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  EXPENSE TRACKER FULL-STACK SERVER IS RUNNING      `);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Website URL: http://localhost:${PORT}             `);
  console.log(`  API Status:  Ready and accepting requests         `);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} in use, retrying in 2 seconds...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 2000);
  } else {
    console.error('Server error:', err);
  }
});

// Handle unhandled exceptions & promise rejections
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`, err.stack);
});
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});

module.exports = app;
