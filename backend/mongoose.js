const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      console.error('❌ ERROR: No se encontró la variable MONGO_URI en Render.');
      return;
    }

    // Configuración para asegurar que use una base de datos específica y no "test"
    await mongoose.connect(uri, {
      dbName: 'LibreriaMakia' // Esto asegura que todos tus usuarios se guarden aquí
    });

    console.log('✅ Conexión exitosa a MongoDB Atlas: LibreriaMakia');
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    
    if (err.message.includes('IP not whitelisted')) {
      console.log('👉 ACCIÓN REQUERIDA: Ve a Atlas > Network Access y agrega 0.0.0.0/0');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;