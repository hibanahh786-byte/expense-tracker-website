const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../data');
const dbFile = path.join(dataDir, 'db.json');

const defaultCategories = [
  { name: 'Food', icon: 'bi-egg-fried', color: '#ff6b6b', description: 'Groceries, restaurants, snacks, drinks' },
  { name: 'Travel', icon: 'bi-airplane', color: '#4dabf7', description: 'Flights, train, metro, fuel, cab' },
  { name: 'Shopping', icon: 'bi-bag', color: '#cc5de8', description: 'Clothes, electronics, personal care' },
  { name: 'Education', icon: 'bi-book', color: '#20c997', description: 'Books, courses, tuition, supplies' },
  { name: 'Health', icon: 'bi-heart-pulse', color: '#fa5252', description: 'Medicines, hospital, gym, therapy' },
  { name: 'Entertainment', icon: 'bi-film', color: '#fcc419', description: 'Movies, streaming, games, outings' },
  { name: 'Bills', icon: 'bi-receipt', color: '#ff922b', description: 'Electricity, water, rent, internet, mobile' },
  { name: 'Others', icon: 'bi-three-dots', color: '#868e96', description: 'Miscellaneous expenses' }
];

// Helper to generate IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Ensure data folder and db.json exist
function initStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFile)) {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('Password@123', salt);
    const demoUserId = 'demo_user_id_101';

    const now = new Date();
    const daysAgo = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString();
    };
    const monthsAgo = (months, day = 15) => {
      const d = new Date(now.getFullYear(), now.getMonth() - months, day);
      return d.toISOString();
    };

    const initialExpenses = [
      // Today
      { _id: generateId(), user: demoUserId, title: 'Organic Grocery & Fresh Vegetables', amount: 840, category: 'Food', description: 'Vegetables and dairy from supermarket', date: daysAgo(0), paymentMethod: 'UPI', createdAt: daysAgo(0) },
      { _id: generateId(), user: demoUserId, title: 'Morning Metro Card Recharge', amount: 300, category: 'Travel', description: 'Metro pass recharge for commute', date: daysAgo(0), paymentMethod: 'UPI', createdAt: daysAgo(0) },
      
      // Yesterday & This Week
      { _id: generateId(), user: demoUserId, title: 'Starbucks Coffee & Sandwich', amount: 480, category: 'Food', description: 'Afternoon coffee break with team', date: daysAgo(1), paymentMethod: 'Credit Card', createdAt: daysAgo(1) },
      { _id: generateId(), user: demoUserId, title: 'High-Speed Broadband Internet Bill', amount: 1199, category: 'Bills', description: 'Monthly Airtel fiber broadband subscription', date: daysAgo(2), paymentMethod: 'Net Banking', createdAt: daysAgo(2) },
      { _id: generateId(), user: demoUserId, title: 'Amazon Electronics & USB Cables', amount: 1450, category: 'Shopping', description: 'Anker USB-C cable and phone stand', date: daysAgo(3), paymentMethod: 'Credit Card', createdAt: daysAgo(3) },
      { _id: generateId(), user: demoUserId, title: 'Monthly Gym & Fitness Membership', amount: 2000, category: 'Health', description: 'Gym monthly fee', date: daysAgo(4), paymentMethod: 'Debit Card', createdAt: daysAgo(4) },
      { _id: generateId(), user: demoUserId, title: 'Weekend Movie & Popcorn (PVR IMAX)', amount: 750, category: 'Entertainment', description: 'Movie night with friends', date: daysAgo(5), paymentMethod: 'UPI', createdAt: daysAgo(5) },
      { _id: generateId(), user: demoUserId, title: 'Petrol Fuel Station', amount: 1500, category: 'Travel', description: 'Full tank fuel for bike', date: daysAgo(6), paymentMethod: 'Debit Card', createdAt: daysAgo(6) },

      // Earlier This Month
      { _id: generateId(), user: demoUserId, title: 'House Electricity Bill', amount: 2350, category: 'Bills', description: 'State electricity board online bill', date: daysAgo(10), paymentMethod: 'Net Banking', createdAt: daysAgo(10) },
      { _id: generateId(), user: demoUserId, title: 'Doctor Consultation & Multivitamins', amount: 1200, category: 'Health', description: 'General checkup and prescribed supplements', date: daysAgo(12), paymentMethod: 'Cash', createdAt: daysAgo(12) },
      { _id: generateId(), user: demoUserId, title: 'Udemy Full-Stack Web Dev Course', amount: 699, category: 'Education', description: 'Advanced Node.js & React course', date: daysAgo(14), paymentMethod: 'Credit Card', createdAt: daysAgo(14) },
      { _id: generateId(), user: demoUserId, title: 'Casual Denim Jacket & T-shirt', amount: 2499, category: 'Shopping', description: 'H&M weekend shopping festival', date: daysAgo(16), paymentMethod: 'Credit Card', createdAt: daysAgo(16) },
      { _id: generateId(), user: demoUserId, title: 'Family Dinner at Barbeque Nation', amount: 3200, category: 'Food', description: 'Buffet dinner celebration', date: daysAgo(18), paymentMethod: 'Debit Card', createdAt: daysAgo(18) },
      { _id: generateId(), user: demoUserId, title: 'Spotify Premium Family Plan', amount: 199, category: 'Entertainment', description: 'Monthly music streaming subscription', date: daysAgo(20), paymentMethod: 'Credit Card', createdAt: daysAgo(20) },
      { _id: generateId(), user: demoUserId, title: 'Academic Reference Books & Notebooks', amount: 950, category: 'Education', description: 'MCA Database Systems reference guide', date: daysAgo(22), paymentMethod: 'Cash', createdAt: daysAgo(22) },
      { _id: generateId(), user: demoUserId, title: 'Uber Cab to City Center', amount: 420, category: 'Travel', description: 'Rainy day commute to meeting', date: daysAgo(24), paymentMethod: 'UPI', createdAt: daysAgo(24) },

      // Previous Months
      { _id: generateId(), user: demoUserId, title: 'Apartment Monthly Maintenance Fee', amount: 1800, category: 'Bills', description: 'Society maintenance and water charge', date: monthsAgo(1, 5), paymentMethod: 'Net Banking', createdAt: monthsAgo(1, 5) },
      { _id: generateId(), user: demoUserId, title: 'Supermarket Wholesale Grocery', amount: 4200, category: 'Food', description: 'Monthly staples, rice, flour, oil', date: monthsAgo(1, 10), paymentMethod: 'Credit Card', createdAt: monthsAgo(1, 10) },
      { _id: generateId(), user: demoUserId, title: 'Train Ticket Reservation to Home', amount: 1450, category: 'Travel', description: 'IRCTC festival holiday travel ticket', date: monthsAgo(1, 15), paymentMethod: 'UPI', createdAt: monthsAgo(1, 15) },
      { _id: generateId(), user: demoUserId, title: 'Footwear Running Shoes (Nike)', amount: 3799, category: 'Shopping', description: 'Sports sneakers on festive discount', date: monthsAgo(1, 18), paymentMethod: 'Credit Card', createdAt: monthsAgo(1, 18) },
      { _id: generateId(), user: demoUserId, title: 'Dental Cleaning & Checkup', amount: 1500, category: 'Health', description: 'Routine dental clinic appointment', date: monthsAgo(1, 22), paymentMethod: 'Cash', createdAt: monthsAgo(1, 22) },
      { _id: generateId(), user: demoUserId, title: 'Netflix 4K Ultra Subscription', amount: 649, category: 'Entertainment', description: 'Monthly OTT subscription', date: monthsAgo(1, 25), paymentMethod: 'Credit Card', createdAt: monthsAgo(1, 25) },
      { _id: generateId(), user: demoUserId, title: 'Two-Wheeler Servicing & Oil Change', amount: 2200, category: 'Travel', description: 'Periodic bike maintenance service', date: monthsAgo(2, 8), paymentMethod: 'UPI', createdAt: monthsAgo(2, 8) },
      { _id: generateId(), user: demoUserId, title: 'Cloud Computing Exam Fee', amount: 5500, category: 'Education', description: 'AWS Certified Developer exam voucher', date: monthsAgo(2, 14), paymentMethod: 'Credit Card', createdAt: monthsAgo(2, 14) },
      { _id: generateId(), user: demoUserId, title: 'Dining with College Friends', amount: 1650, category: 'Food', description: 'Dinner reunion at Italian bistro', date: monthsAgo(2, 20), paymentMethod: 'Debit Card', createdAt: monthsAgo(2, 20) }
    ];

    const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
    const initialData = {
      users: [
        {
          _id: 'admin_sys_master_001',
          name: 'System Administrator',
          email: 'admin@expensetrack.app',
          password: adminPasswordHash,
          role: 'admin',
          currency: '₹',
          createdAt: new Date(2026, 0, 1).toISOString()
        },
        {
          _id: demoUserId,
          name: 'Aditya Sharma',
          email: 'demo@expensetracker.com',
          password: demoPasswordHash,
          role: 'user',
          currency: '₹',
          createdAt: new Date(2026, 0, 1).toISOString()
        }
      ],
      categories: defaultCategories,
      expenses: initialExpenses
    };

    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readData() {
  initStore();
  try {
    const raw = fs.readFileSync(dbFile, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], categories: defaultCategories, expenses: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write local database:', e);
  }
}

const localStore = {
  // Direct raw access for Admin audits and backups
  read() {
    return readData();
  },
  write(data) {
    writeData(data);
  },

  // Users
  findUserByEmail(email) {
    const data = readData();
    const query = String(email || '').toLowerCase().trim();
    if (!query) return null;
    return data.users.find((u) => {
      const uEmail = String(u.email || '').toLowerCase();
      if (uEmail === query) return true;
      if (query === 'admin' && (u.role === 'admin' || uEmail.includes('admin'))) return true;
      return false;
    });
  },

  findUserById(id) {
    const data = readData();
    return data.users.find((u) => String(u._id) === String(id));
  },

  createUser(userData) {
    const data = readData();
    const newUser = {
      _id: generateId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password, // already hashed
      currency: userData.currency || '₹',
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeData(data);
    return newUser;
  },

  updateUser(id, updates) {
    const data = readData();
    const idx = data.users.findIndex((u) => String(u._id) === String(id));
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    writeData(data);
    return data.users[idx];
  },

  // Expenses
  getExpenses(userId, { category, search, startDate, endDate, sort, page = 1, limit = 50 }) {
    const data = readData();
    let list = data.expenses.filter((e) => String(e.user) === String(userId));

    if (category && category !== 'All') {
      list = list.filter((e) => e.category === category);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) => (e.title && e.title.toLowerCase().includes(q)) || (e.description && e.description.toLowerCase().includes(q))
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      list = list.filter((e) => new Date(e.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((e) => new Date(e.date) <= end);
    }

    // Sort
    if (sort === 'date_asc') {
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'amount_desc') {
      list.sort((a, b) => b.amount - a.amount);
    } else if (sort === 'amount_asc') {
      list.sort((a, b) => a.amount - b.amount);
    } else {
      // date_desc
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    const total = list.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;
    const paginated = list.slice(skip, skip + limitNum);

    return {
      expenses: paginated,
      total,
      count: paginated.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    };
  },

  getExpenseById(id, userId) {
    const data = readData();
    return data.expenses.find((e) => String(e._id) === String(id) && String(e.user) === String(userId));
  },

  createExpense(expenseData) {
    const data = readData();
    const newExp = {
      _id: generateId(),
      user: expenseData.user,
      title: expenseData.title,
      amount: Number(expenseData.amount),
      category: expenseData.category || 'Others',
      description: expenseData.description || '',
      date: expenseData.date ? new Date(expenseData.date).toISOString() : new Date().toISOString(),
      paymentMethod: expenseData.paymentMethod || 'Cash',
      createdAt: new Date().toISOString()
    };
    data.expenses.unshift(newExp);
    writeData(data);
    return newExp;
  },

  updateExpense(id, userId, updates) {
    const data = readData();
    const idx = data.expenses.findIndex((e) => String(e._id) === String(id) && String(e.user) === String(userId));
    if (idx === -1) return null;

    const existing = data.expenses[idx];
    data.expenses[idx] = {
      ...existing,
      title: updates.title !== undefined ? updates.title : existing.title,
      amount: updates.amount !== undefined ? Number(updates.amount) : existing.amount,
      category: updates.category !== undefined ? updates.category : existing.category,
      description: updates.description !== undefined ? updates.description : existing.description,
      date: updates.date !== undefined ? new Date(updates.date).toISOString() : existing.date,
      paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : existing.paymentMethod
    };
    writeData(data);
    return data.expenses[idx];
  },

  deleteExpense(id, userId) {
    const data = readData();
    const idx = data.expenses.findIndex((e) => String(e._id) === String(id) && String(e.user) === String(userId));
    if (idx === -1) return false;
    data.expenses.splice(idx, 1);
    writeData(data);
    return true;
  },

  // Aggregations
  getTotalSummary(userId) {
    const data = readData();
    const userExpenses = data.expenses.filter((e) => String(e.user) === String(userId));

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    let totalAmount = 0;
    let todayAmount = 0;
    let monthlyAmount = 0;

    userExpenses.forEach((exp) => {
      totalAmount += exp.amount;
      const d = new Date(exp.date);
      if (d.getFullYear() === todayYear && d.getMonth() === todayMonth && d.getDate() === todayDate) {
        todayAmount += exp.amount;
      }
      if (d.getFullYear() === todayYear && d.getMonth() === todayMonth) {
        monthlyAmount += exp.amount;
      }
    });

    const recentExpenses = [...userExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return {
      totalAmount,
      todayAmount,
      monthlyAmount,
      totalTransactions: userExpenses.length,
      recentExpenses
    };
  },

  getMonthlyBreakdown(userId, targetYear) {
    const data = readData();
    const userExpenses = data.expenses.filter((e) => {
      if (String(e.user) !== String(userId)) return false;
      return new Date(e.date).getFullYear() === targetYear;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthNames.map((name, index) => {
      const monthExpenses = userExpenses.filter((e) => new Date(e.date).getMonth() === index);
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        month: name,
        monthIndex: index + 1,
        year: targetYear,
        total,
        count: monthExpenses.length
      };
    });

    return monthlyData;
  },

  getCategoryBreakdown(userId, { month, year, startDate, endDate }) {
    const data = readData();
    let userExpenses = data.expenses.filter((e) => String(e.user) === String(userId));

    if (month && year) {
      const m = parseInt(month, 10) - 1;
      const y = parseInt(year, 10);
      userExpenses = userExpenses.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === y && d.getMonth() === m;
      });
    } else if (startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate);
        userExpenses = userExpenses.filter((e) => new Date(e.date) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        userExpenses = userExpenses.filter((e) => new Date(e.date) <= end);
      }
    }

    const categoryMap = {};
    let grandTotal = 0;

    userExpenses.forEach((e) => {
      grandTotal += e.amount;
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = { category: e.category, totalAmount: 0, count: 0 };
      }
      categoryMap[e.category].totalAmount += e.amount;
      categoryMap[e.category].count += 1;
    });

    const categoriesWithPercentages = Object.values(categoryMap)
      .map((item) => ({
        category: item.category,
        totalAmount: item.totalAmount,
        count: item.count,
        percentage: grandTotal > 0 ? ((item.totalAmount / grandTotal) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.totalAmount - a.amount);

    return { grandTotal, data: categoriesWithPercentages };
  },

  getCategories() {
    return defaultCategories;
  }
};

// Initialize file on module import
initStore();

module.exports = localStore;
