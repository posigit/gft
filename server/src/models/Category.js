const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: function() {
      return !this.isGlobal;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness of category name within a hotel or globally
categorySchema.index({ name: 1, hotel: 1 }, { unique: true, partialFilterExpression: { hotel: { $exists: true } } });
categorySchema.index({ name: 1, isGlobal: 1 }, { unique: true, partialFilterExpression: { isGlobal: true } });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 