const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      enum: [
        'Food',
        'Travel',
        'Shopping',
        'Education',
        'Health',
        'Entertainment',
        'Bills',
        'Others'
      ]
    },
    icon: {
      type: String,
      default: 'bi-tag'
    },
    color: {
      type: String,
      default: '#6c757d'
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Category', categorySchema);
