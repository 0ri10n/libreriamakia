const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'El título es obligatorio'] 
  },
  author: { 
    type: String, 
    required: [true, 'El autor es obligatorio'] 
  },
  description: { type: String },
  
  category: { 
    type: String, 
    required: true,
    enum: {
      values: [
        'Cuentos Infantiles', 
        'Aventuras Juveniles', 
        'Literatura Clásica', 
        'Historia y Biografías', 
        'Arte y Cultura', 
        'Ciencia Ficción', 
        'Terror', 
        'Manuales',        
        'Romance'
      ],
      message: '{VALUE} no es una categoría permitida'
    }
  }, 
  
  image: { type: String }, 
  ageRates: {
    type: String,
    required: true,
    enum: {
      values: ['Todo Público', '7', '12', '16', '18'],
      message: '{VALUE} no es una clasificación válida'
    },
    default: 'Todo Público'
  },
  
  // Stock con validación para evitar números negativos
  Stock: { 
    type: Number, 
    default: 0,
    min: [0, 'El stock no puede ser negativo'] 
  }
});

module.exports = mongoose.model('Books', BookSchema);