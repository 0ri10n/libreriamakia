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

// ENCRIPTACIÓN DE CONTRASEÑAS (Versión compatible sin error 'next')
UserSchema.pre('save', async function() { 
  if (!this.isModified('password')) return; 

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error; // Mongoose manejará este error automáticamente
  }
});

// Exportar como 'User'
module.exports = mongoose.model('User', UserSchema);