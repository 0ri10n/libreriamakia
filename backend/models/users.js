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
    unique: true 
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria'] 
  },
  role: {
    type: String,
    enum: ['user', 'admin'], 
    default: 'user' 
  }
});

// ENCRIPTACIÓN DE CONTRASEÑAS
// Corregido para usar bcrypt de forma más robusta antes de guardar
UserSchema.pre('save', async function(next) { 
  if (!this.isModified('password')) return next(); 

  try {
    const salt = await bcrypt.genSalt(10); // Generamos el salt por separado
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Importante: El nombre del modelo debe ser 'User' (singular) por convención de Mongoose
module.exports = mongoose.model('User', UserSchema);