const mongoose = require('mongoose');
const Category = require('../models/Category');

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

const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(defaultCategories);
      console.log('✓ Default expense categories seeded successfully');
    }
  } catch (err) {
    console.error('Category seeding error:', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    await seedDefaultCategories();
    return true;
  } catch (error) {
    console.error(`✗ MongoDB Connection Error: ${error.message}`);
    console.log('ℹ Ensure MongoDB service is running (mongod) or provide a valid MONGODB_URI in your .env file.');
    return false;
  }
};

module.exports = connectDB;
