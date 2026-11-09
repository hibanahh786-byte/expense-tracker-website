const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

dotenv.config();

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

const seedData = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker';
  let mongoConnected = false;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    mongoConnected = true;
    console.log('✓ Connected to MongoDB service for database seeding...');

    // Seed Categories
    await Category.deleteMany();
    await Category.insertMany(defaultCategories);
    console.log('✓ Categories seeded in MongoDB.');

    // Seed Admin User
    const adminEmail = 'admin@expensetrack.app';
    await User.deleteOne({ email: adminEmail });
    const adminUser = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: '1234',
      role: 'admin',
      currency: '₹'
    });
    console.log(`✓ Admin user created in MongoDB: ${adminUser.email} / 1234`);

    // Seed Demo User
    const demoEmail = 'demo@expensetracker.com';
    await User.deleteOne({ email: demoEmail });

    const demoUser = await User.create({
      name: 'Aditya Sharma',
      email: demoEmail,
      password: 'Password@123',
      role: 'user',
      currency: '₹'
    });
    console.log(`✓ Demo user created in MongoDB: ${demoUser.email} / Password@123`);

    // Clean previous demo expenses
    await Expense.deleteMany({ user: demoUser._id });

    // Relative dates
    const now = new Date();
    const daysAgo = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d;
    };
    const monthsAgo = (months, day = 15) => {
      const d = new Date(now.getFullYear(), now.getMonth() - months, day);
      return d;
    };

    const sampleExpenses = [
      { title: 'Organic Grocery & Fresh Vegetables', amount: 840, category: 'Food', description: 'Vegetables and dairy from supermarket', date: daysAgo(0), paymentMethod: 'UPI' },
      { title: 'Morning Metro Card Recharge', amount: 300, category: 'Travel', description: 'Metro pass recharge for commute', date: daysAgo(0), paymentMethod: 'UPI' },
      { title: 'Starbucks Coffee & Sandwich', amount: 480, category: 'Food', description: 'Afternoon coffee break with team', date: daysAgo(1), paymentMethod: 'Credit Card' },
      { title: 'High-Speed Broadband Internet Bill', amount: 1199, category: 'Bills', description: 'Monthly Airtel fiber broadband subscription', date: daysAgo(2), paymentMethod: 'Net Banking' },
      { title: 'Amazon Electronics & USB Cables', amount: 1450, category: 'Shopping', description: 'Anker USB-C cable and phone stand', date: daysAgo(3), paymentMethod: 'Credit Card' },
      { title: 'Monthly Gym & Fitness Membership', amount: 2000, category: 'Health', description: 'Gym monthly fee', date: daysAgo(4), paymentMethod: 'Debit Card' },
      { title: 'Weekend Movie & Popcorn (PVR IMAX)', amount: 750, category: 'Entertainment', description: 'Movie night with friends', date: daysAgo(5), paymentMethod: 'UPI' },
      { title: 'Petrol Fuel Station', amount: 1500, category: 'Travel', description: 'Full tank fuel for bike', date: daysAgo(6), paymentMethod: 'Debit Card' },
      { title: 'House Electricity Bill', amount: 2350, category: 'Bills', description: 'State electricity board online bill', date: daysAgo(10), paymentMethod: 'Net Banking' },
      { title: 'Doctor Consultation & Multivitamins', amount: 1200, category: 'Health', description: 'General checkup and prescribed supplements', date: daysAgo(12), paymentMethod: 'Cash' },
      { title: 'Udemy Full-Stack Web Dev Course', amount: 699, category: 'Education', description: 'Advanced Node.js & React course', date: daysAgo(14), paymentMethod: 'Credit Card' },
      { title: 'Casual Denim Jacket & T-shirt', amount: 2499, category: 'Shopping', description: 'H&M weekend shopping festival', date: daysAgo(16), paymentMethod: 'Credit Card' },
      { title: 'Family Dinner at Barbeque Nation', amount: 3200, category: 'Food', description: 'Buffet dinner celebration', date: daysAgo(18), paymentMethod: 'Debit Card' },
      { title: 'Spotify Premium Family Plan', amount: 199, category: 'Entertainment', description: 'Monthly music streaming subscription', date: daysAgo(20), paymentMethod: 'Credit Card' },
      { title: 'Academic Reference Books & Notebooks', amount: 950, category: 'Education', description: 'MCA Database Systems reference guide', date: daysAgo(22), paymentMethod: 'Cash' },
      { title: 'Uber Cab to City Center', amount: 420, category: 'Travel', description: 'Rainy day commute to meeting', date: daysAgo(24), paymentMethod: 'UPI' },
      { title: 'Apartment Monthly Maintenance Fee', amount: 1800, category: 'Bills', description: 'Society maintenance and water charge', date: monthsAgo(1, 5), paymentMethod: 'Net Banking' },
      { title: 'Supermarket Wholesale Grocery', amount: 4200, category: 'Food', description: 'Monthly staples, rice, flour, oil', date: monthsAgo(1, 10), paymentMethod: 'Credit Card' },
      { title: 'Train Ticket Reservation to Home', amount: 1450, category: 'Travel', description: 'IRCTC festival holiday travel ticket', date: monthsAgo(1, 15), paymentMethod: 'UPI' },
      { title: 'Footwear Running Shoes (Nike)', amount: 3799, category: 'Shopping', description: 'Sports sneakers on festive discount', date: monthsAgo(1, 18), paymentMethod: 'Credit Card' },
      { title: 'Dental Cleaning & Checkup', amount: 1500, category: 'Health', description: 'Routine dental clinic appointment', date: monthsAgo(1, 22), paymentMethod: 'Cash' },
      { title: 'Netflix 4K Ultra Subscription', amount: 649, category: 'Entertainment', description: 'Monthly OTT subscription', date: monthsAgo(1, 25), paymentMethod: 'Credit Card' },
      { title: 'Two-Wheeler Servicing & Oil Change', amount: 2200, category: 'Travel', description: 'Periodic bike maintenance service', date: monthsAgo(2, 8), paymentMethod: 'UPI' },
      { title: 'Cloud Computing Certification Exam Fee', amount: 5500, category: 'Education', description: 'AWS Certified Developer exam voucher', date: monthsAgo(2, 14), paymentMethod: 'Credit Card' },
      { title: 'Dining with College Friends', amount: 1650, category: 'Food', description: 'Dinner reunion at Italian bistro', date: monthsAgo(2, 20), paymentMethod: 'Debit Card' }
    ];

    const preparedExpenses = sampleExpenses.map((exp) => ({ ...exp, user: demoUser._id }));
    await Expense.insertMany(preparedExpenses);
    console.log(`✓ ${preparedExpenses.length} expense transactions seeded into MongoDB successfully!`);
    await mongoose.connection.close();
  } catch (error) {
    console.log('ℹ Local MongoDB service not active. Seeding local database fallback...');
    // Delete existing db.json to trigger clean re-seeding
    const dbFile = path.join(__dirname, '../data/db.json');
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    // Re-trigger localStore initialization
    require('../config/localStore');
    console.log('✓ Local database successfully seeded with demo user (demo@expensetracker.com / Password@123) and 25 transactions!');
  }

  process.exit(0);
};

seedData();
