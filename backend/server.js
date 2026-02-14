require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const connectDB = require('./mongoose');
const User = require('./models/users');
const Book = require('./models/books'); 
const Loan = require('./models/loans');
const proteger = require('./middleware/authMiddleware');

const app = express();
connectDB(); 

app.use(cors());          
app.use(express.json());  

// Servir estáticos: Sube un nivel desde /backend para entrar a /Frontend
app.use(express.static(path.join(__dirname, '../Frontend')));

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

    const esCorrecta = await bcrypt.compare(password, user.password);
    if (!esCorrecta) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token }); 
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'El usuario ya existe' });

    user = new User({ name, email, password });
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.status(201).json({ token, msg: 'Usuario registrado con éxito' });
  } catch (err) {
    res.status(500).json({ msg: 'Error en registro: ' + err.message });
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
        if (busqueda) query.$or = [{ title: { $regex: busqueda, $options: 'i' } }, { author: { $regex: busqueda, $options: 'i' } }];
        if (categoria && categoria !== 'Todo') query.category = categoria;
        const books = await Book.find(query);
        res.json(books);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));