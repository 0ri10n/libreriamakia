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
  loanDate: {type: Date, required: true},
  returnDate: {type: Date, required: true},
});

module.exports = mongoose.model('Loans', LoanSchema);