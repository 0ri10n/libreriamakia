require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// IMPORTAR CONEXIÓN Y MODELOS
const connectDB = require('./mongoose');
const User = require('./models/users');
const Book = require('./models/books'); 
const Loan = require('./models/loans');
const proteger = require('./middleware/authMiddleware');

const app = express();

// Iniciar Conexión a MongoDB Atlas
connectDB(); 

// MIDDLEWARES
app.use(cors());          
app.use(express.json());  

// Servir archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, '../Frontend')));

// --- RUTAS DE AUTENTICACIÓN ---

// Registro de Usuario (CORREGIDO PARA GUARDAR EN ATLAS)
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // 1. Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'El usuario ya existe' });

    // 2. Crear instancia del usuario
    user = new User({ name, email, password });
    
    // 3. GUARDAR EN MONGO ATLAS
    await user.save();

    // 4. Generar Token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    
    res.status(201).json({ token, msg: 'Usuario registrado con éxito' });
    console.log(`✅ Usuario guardado correctamente: ${email}`);

  } catch (err) {
    console.error("❌ Error en registro:", err.message);
    res.status(500).json({ msg: 'Error al conectar con la base de datos' });
  }
});

// Login de Usuario
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
        console.log(`⚠️ Intento de login fallido: ${email} (No encontrado)`);
        return res.status(400).json({ msg: 'Usuario no encontrado' });
    }

    const esCorrecta = await bcrypt.compare(password, user.password);
    if (!esCorrecta) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });

  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
});

// --- API ADMINISTRATIVA ---
app.get('/api/users', proteger, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: "Error al obtener usuarios" });
    }
});

app.get('/api/loans/all', proteger, async (req, res) => {
    try {
        const loans = await Loan.find().populate('book');
        res.json(loans);
    } catch (err) {
        res.status(500).json({ msg: "Error al obtener préstamos" });
    }
});

app.get('/api/books', async (req, res) => {
    try {
        const { busqueda, categoria } = req.query;
        let query = {};
        if (busqueda) {
            query.$or = [
                { title: { $regex: busqueda, $options: 'i' } },
                { author: { $regex: busqueda, $options: 'i' } }
            ];
        }
        if (categoria && categoria !== 'Todo') query.category = categoria;
        const books = await Book.find(query);
        res.json(books);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SOLUCIÓN PARA RENDER (EXPRESIÓN REGULAR PURA) ---
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));