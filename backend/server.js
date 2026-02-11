require('dotenv').config();
const express = require('express');
const connectDB = require('./mongoose');

const app = express();

// Conectar BD
connectDB();

// Middleware para leer JSON
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Servidor corriendo en puerto ${PORT}`));

const User = require('./models/users'); // Asegúrate de que la ruta sea correcta

//PRUEBAS PARA VERIFICAR CONEXIÓN, LUEGO LAS QUITAN

app.post('/test-user', async (req, res) => {
  try {
    const newUser = new User({
      name: "Arquitecto Test",
      email: "test@biblioteca.com",
      password: "password123"
    });
    await newUser.save();
    res.status(201).send(" Usuario creado y contraseña encriptada en Atlas");
  } catch (err) {
    res.status(500).send(" Error: " + err.message);
  }
});

const Book = require('./models/books');

app.get('/test-book', async (req, res) => {
  try {
    const testBook = new Book({
      title: "El Psicoanalista",
      author: "John Katzenbach", // Por ahora es String según tu modelo actual
      description: "Un thriller de suspenso.",
      category: "Terror",
      ageRates: "+18", // Probando tu enumeración
      Stock: 10
    });

    await testBook.save();
    res.send("📖 ¡Libro creado con éxito en la base de datos!");
  } catch (err) {
    res.status(500).send("❌ Error en el modelo de libros: " + err.message);
  }
});