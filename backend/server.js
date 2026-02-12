require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./mongoose');

const app = express();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Conectar BD
connectDB();

app.use(cors());
// Middleware para leer JSON
app.use(express.json());

const proteger = require('./middleware/authMiddleware');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Servidor corriendo en puerto ${PORT}`));

const User = require('./models/users'); // Asegúrate de que la ruta sea correcta

// RUTA DE LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    //Verificar si el usuario existe
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

    //Comparar contraseña encriptada
    const esCorrecta = await bcrypt.compare(password, user.password);
    if (!esCorrecta) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    //Crear y firmar el JWT
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).send('Error en el servidor');
  }
});


//PRUEBAS PARA VERIFICAR CONEXIÓN, EVIDENCIA, LAS TABLAS ESTAN EN MONGO

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

app.get('/test-book', proteger, async (req, res) => {
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
    res.send("¡Libro creado con éxito en la base de datos!");
  } catch (err) {
    res.status(500).send("❌ Error en el modelo de libros: " + err.message);
  }
});
