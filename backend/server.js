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

// MIDDLEWARES GLOBALES
app.use(cors());          
app.use(express.json());  

// Servir archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, '../Frontend')));

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Faltan datos obligatorios' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'El usuario ya existe' });

    user = new User({ name, email, password });
    await user.save(); 

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    
    res.status(201).json({ token, msg: 'Usuario registrado con éxito' });
    console.log(`✅ Usuario guardado en Atlas: ${email}`);
  } catch (err) {
    console.error("❌ ERROR AL REGISTRAR:", err.message);
    res.status(500).json({ msg: 'Error de base de datos' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

    const esCorrecta = await bcrypt.compare(password, user.password);
    if (!esCorrecta) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'Error interno del servidor' });
  }
});

// --- API DE LIBROS Y PRÉSTAMOS (Basado en tu original) ---

app.get('/api/books', async (req, res) => {
    try {
        const { busqueda, categoria } = req.query;
        let query = {};
        if (busqueda) {
            query.$or = [{ title: { $regex: busqueda, $options: 'i' } }, { author: { $regex: busqueda, $options: 'i' } }];
        }
        if (categoria && categoria !== 'Todo') query.category = categoria;
        const books = await Book.find(query);
        res.json(books);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/loans/all', proteger, async (req, res) => {
    try {
        const loans = await Loan.find().populate('book').populate('user', 'email');
        res.json(loans);
    } catch (err) { res.status(500).json({ msg: "Error" }); }
});

// --- SOLUCIÓN PARA RENDER (CORREGIDO PARA NODE 22+) ---
// Usamos '/*' para evitar el error PathError
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));