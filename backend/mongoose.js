const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      console.error('❌ ERROR: No se encontró la variable MONGO_URI en Render.');
      return;
    }

    // Forzamos el uso de la base de datos LibreriaMakia
    await mongoose.connect(uri, {
      dbName: 'LibreriaMakia' 
    });

    console.log('Conexión exitosa a MongoDB Atlas: LibreriaMakia');
  } catch (err) {
    console.error(' Error de conexión:', err.message);

    if (err.message.includes('IP not whitelisted')) {
      console.log('ACCIÓN: Agrega 0.0.0.0/0 en Network Access de Atlas');
    }

    // --- No matar el proceso si estamos en test ---
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    } else {
        console.log(' Aviso: Falló la conexión en modo TEST, pero el proceso continúa.');
    }
  }
};

module.exports = connectDB;