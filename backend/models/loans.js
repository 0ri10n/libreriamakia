const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  // Vínculo con el Libro
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Books",
    required: true
  },
  // Vínculo con el Usuario
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  // Fecha de préstamo: Se pone sola con la fecha/hora actual
  loanDate: {
    type: Date,
    default: Date.now 
  },
  // Fecha de devolución: El servidor la calcula (hoy + 15 días), 
  // así que le quitamos el "required" para evitar bloqueos.
  returnDate: {
    type: Date
  },
  // Estado (Opcional, pero útil para control interno)
  status: {
    type: String,
    default: 'active'
  }
});

module.exports = mongoose.model('Loans', LoanSchema);