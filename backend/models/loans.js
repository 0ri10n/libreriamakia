const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Books", 
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  loanDate: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  returnDate: { 
    type: Date, 
    required: true 
  }

  actualReturnDate: {
    type: Date
  },

  status: { 
    type: String, 
    enum: ['active', 'returned'], 
    default: 'active' 
  },
  fine: { type: Number, default: 0 }
});

module.exports = mongoose.model('Loans', LoanSchema);