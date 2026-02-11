const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: {type: String, },
  category: String,
  ageRates: {
    type: String,
    required: true,
    enum: {
      values: ['Todo Público', '+7', '+12', '+16', '+18'],
      message: '{VALUE} no es una clasificación de edad válida'
    },
    default: 'Todo Público'
  },
  Stock: {type: Number, default: 0}
});

module.exports = mongoose.model('Books', BookSchema);