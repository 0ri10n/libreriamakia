const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
});

// ------------ ENCRIPTACIÓN DE CONTRASEÑAS ------------ //
UserSchema.pre('save', async function() { 
  
  if (!this.isModified('password')) return; 

  try {
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

module.exports = mongoose.model('Users', UserSchema);