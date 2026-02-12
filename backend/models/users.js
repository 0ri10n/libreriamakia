const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'] 
  },
  email: { 
    type: String, 
    required: [true, 'El email es obligatorio'],
    unique: true // Evita correos duplicados
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria'] 
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Solo permite estos dos valores
    default: 'user' // Por defecto todos son clientes normales
  }
});

// ENCRIPTACIÓN DE CONTRASEÑAS //
UserSchema.pre('save', async function(next) { 
  if (!this.isModified('password')) return next(); 

  try {
    const salt = await bcrypt.hash(this.password, 10); // Simplificado
    this.password = salt;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Users', UserSchema);