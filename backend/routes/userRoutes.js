const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAllPlatformExpenses,
  deleteAdminExpense,
  exportDatabaseBackup
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.put('/change-password', changePassword);

// Dedicated Admin Portal Routes (Requires Admin Role)
router.get('/admin/stats', adminOnly, getAdminStats);
router.get('/admin/users', adminOnly, getAdminUsers);
router.put('/admin/users/:id/role', adminOnly, updateUserRole);
router.delete('/admin/users/:id', adminOnly, deleteUser);
router.get('/admin/expenses', adminOnly, getAllPlatformExpenses);
router.delete('/admin/expenses/:id', adminOnly, deleteAdminExpense);
router.get('/admin/backup', adminOnly, exportDatabaseBackup);

module.exports = router;
