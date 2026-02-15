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
    // 1. Validar que lleguen los datos
    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Faltan datos obligatorios' });
    }

    // 2. Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'El usuario ya existe' });

    // 3. Crear y guardar (La encriptación ocurre en el modelo)
    user = new User({ name, email, password });
    await user.save(); 

    // 4. Generar Token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    

    res.status(201).json({ 
        token, 
        role: user.role, 
        msg: 'Usuario registrado con éxito' 
    });
    } catch (err) {
        console.error("❌ ERROR AL REGISTRAR:", err.message);
        res.status(500).json({ msg: 'Error de base de datos: ' + err.message });
    }
    });

// ... (Resto de tu server.js)

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

    const esCorrecta = await bcrypt.compare(password, user.password);
    if (!esCorrecta) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ 
    token, 
    role: user.role 
});
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
});

// --- API DE LIBROS (LECTURA, CREACIÓN, EDICIÓN, BORRADO) ---

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

// Agregar Libro (Nuevo)
app.post('/api/books', proteger, async (req, res) => {
    try {
        const newBook = new Book(req.body);
        await newBook.save();
        res.status(201).json(newBook);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Editar Libro (Nuevo)
app.put('/api/books/:id', proteger, async (req, res) => {
    try {
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedBook);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Borrar Libro (Nuevo)
app.delete('/api/books/:id', proteger, async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ msg: "Libro eliminado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Borrado Masivo (Checkboxes)
app.delete('/api/books/batch', proteger, async (req, res) => {
    try {
        const { ids } = req.body;
        await Book.deleteMany({ _id: { $in: ids } });
        res.json({ msg: "Libros eliminados con éxito" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API ADMINISTRATIVA (CONTADORES) ---

app.get('/api/users', proteger, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) { res.status(500).json({ msg: "Error al obtener usuarios" }); }
});

app.get('/api/loans/all', proteger, async (req, res) => {
    try {
        
        const loans = await Loan.find()
            .populate('book')
            .populate('user', 'name email'); 
            
        res.json(loans);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ msg: "Error al obtener préstamos" }); 
    }
});
// --- RUTAS DE PRÉSTAMOS (USUARIO) ---

app.post('/api/loans', proteger, async (req, res) => {
    try {
        const { bookId } = req.body;
        
        // CORRECCIÓN 1: Definir userId de forma segura (token o body) y usarlo consistentemente
        const userId = req.body.userId || req.user.id || req.user._id;

        if (!userId) {
            return res.status(401).json({ msg: "Error de autenticación: Usuario no identificado." });
        }

        // 1. Buscar el libro
        const book = await Book.findById(bookId);
        
        if (!book) {
            return res.status(404).json({ msg: "El libro no existe." });
        }

        // 2. Validar Stock
        if (book.Stock < 1) {
            return res.status(400).json({ msg: "El libro está agotado." });
        }

        // 3. Verificar si ya tiene el libro prestado (usando la variable userId corregida)
        const prestamoExistente = await Loan.findOne({ user: userId, book: bookId });
        if (prestamoExistente) {
            return res.status(400).json({ msg: "Ya tienes este libro en préstamo." });
        }

        // 4. Calcular Fechas
        const fechaPrestamo = new Date();
        const fechaDevolucion = new Date();
        fechaDevolucion.setDate(fechaPrestamo.getDate() + 15); 

        // 5. Crear el préstamo
        const loan = new Loan({ 
            user: userId, 
            book: bookId,
            loanDate: fechaPrestamo,
            returnDate: fechaDevolucion
        });
        
        await loan.save(); 

        // 6. CORRECCIÓN 2: Actualización atómica del stock (Más seguro que book.save)
        await Book.findByIdAndUpdate(bookId, { $inc: { Stock: -1 } });

        res.status(201).json(loan);

    } catch (err) { 
        console.error("Error préstamo:", err);
        res.status(500).json({ msg: "Error al procesar préstamo: " + err.message }); 
    }
});

// --- SOLUCIÓN PARA RENDER (EXPRESIÓN REGULAR PURA) ---
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));