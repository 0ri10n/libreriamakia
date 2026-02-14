const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Validación de seguridad: Verifica que la variable MONGO_URI exista en Render
    if (!process.env.MONGO_URI) {
        throw new Error("La variable de entorno MONGO_URI no está definida en la configuración de Render.");
    }

    // Configuración de conexión recomendada para Atlas
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ MongoDB Atlas Conectado con éxito');
    
  } catch (err) {
    console.error('❌ Error de conexión a MongoDB Atlas:', err.message);
    
    // En producción, es vital saber qué error específico detuvo la app
    process.exit(1); 
  }
};

module.exports = connectDB;