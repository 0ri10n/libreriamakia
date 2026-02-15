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
app.get('/api/loans', proteger, async (req, res) => {
    try {
        // CORRECCIÓN: Buscar los préstamos del usuario y traer los datos del libro
        const loans = await Loan.find({ user: req.user.id }).populate('book');
        
        res.json(loans);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Error al obtener tus préstamos" });
    }
});

app.post('/api/loans', proteger, async (req, res) => {
    try {
        const { bookId } = req.body;

        const userId = req.body.userId || (req.user && (req.user.id || req.user._id));

        if (!userId) {
            return res.status(401).json({ msg: "Error de autenticación: No se identificó al usuario." });
        }

            const prestamosPendientes = await Loan.find({ user: userId, status: 'active' });
            const tieneAtrasos = prestamosPendientes.some(p => new Date() > new Date(p.returnDate));
            const tieneMultas = prestamosPendientes.some(p => p.fine > 0);

            if (tieneAtrasos || tieneMultas) {
                return res.status(403).json({ 
                    msg: "Solicitud denegada: Tienes libros atrasados o multas pendientes de pago." 
                });
            }

        // 2. Buscar el libro y validar existencia
        const book = await Book.findById(bookId);
        
        if (!book) {
            return res.status(404).json({ msg: "El libro no existe." });
        }

        // 3. Validar Stock
        if (book.Stock < 1) {
            return res.status(400).json({ msg: "El libro está agotado." });
        }

        // 4. Verificar si ya tiene el libro prestado (Evita duplicados)
        const prestamoExistente = await Loan.findOne({ user: userId, book: bookId, status: 'active' });
        if (prestamoExistente) {
            return res.status(400).json({ msg: "Ya tienes este libro en préstamo." });
        }

        // 5. Calcular Fechas (Fecha actual y devolución en 15 días)
        const fechaPrestamo = new Date();
        const fechaDevolucion = new Date();
        fechaDevolucion.setDate(fechaPrestamo.getDate() + 15); 

        // 6. Crear el objeto Préstamo
        const loan = new Loan({ 
            user: userId, 
            book: bookId,
            loanDate: fechaPrestamo,
            returnDate: fechaDevolucion
        });
        
        await loan.save(); 

        // 7. CORRECCIÓN: Actualización atómica del stock (Más seguro y evita errores de versión)
        await Book.findByIdAndUpdate(bookId, { $inc: { Stock: -1 } });

        res.status(201).json(loan);

    } catch (err) { 
        console.error("Error al crear préstamo:", err); // Log para depuración en render
        res.status(500).json({ msg: "Error interno al procesar préstamo: " + err.message }); 
    }
});

// Devolver prestamo
app.put('/api/loans/return/:id', proteger, async (req, res) => {
    try {
        const loanId = req.params.id;

        // 1. Buscar el préstamo
        const loan = await Loan.findById(loanId);
        
        if (!loan) {
            return res.status(404).json({ msg: "Préstamo no encontrado" });
        }

        // 2. Verificar si ya fue devuelto
        if (loan.status === 'returned') {
            return res.status(400).json({ msg: "Este libro ya fue devuelto anteriormente." });
        }

        // --- VALIDACIÓN DE LOS 3 DÍAS ---
        const fechaPrestamo = new Date(loan.loanDate);
        const fechaHoy = new Date();

        // Restamos las fechas (resultado en milisegundos)
        const diferenciaTiempo = fechaHoy.getTime() - fechaPrestamo.getTime();
        
        // Convertimos a días: (1000ms * 60s * 60min * 24h)
        const diasTranscurridos = diferenciaTiempo / (1000 * 3600 * 24);

        // Si han pasado menos de 3 días, bloqueamos la devolución
        if (diasTranscurridos < 3) {
            const diasFaltantes = Math.ceil(3 - diasTranscurridos);
            return res.status(400).json({ 
                msg: `Política de Biblioteca: Debes conservar el libro mínimo 3 días. Faltan ${diasFaltantes} día(s) para poder devolverlo.` 
            });
        }

        const fechaLimite = new Date(loan.returnDate);
        let multaCalculada = 0;

        if (fechaHoy > fechaLimite) {
            // Calculamos la diferencia de tiempo en milisegundos
            const diferenciaMs = fechaHoy - fechaLimite;
            // Convertimos a días (redondeando hacia arriba cualquier fracción de día)
            const diasRetraso = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
            
            // Tarifa: $10 MXN por día
            multaCalculada = diasRetraso * 10;
        }

        // 3. Actualizar el préstamo a "devuelto"
        loan.status = 'returned';
        loan.actualReturnDate = fechaHoy;
        loan.fine = multaCalculada;
        await loan.save();

        // 4. Devolver Stock al libro (+1)
        await Book.findByIdAndUpdate(loan.book, { $inc: { Stock: 1 } });

        res.json({ msg: "Libro devuelto exitosamente. ¡Gracias!", loan });

    } catch (err) {
        console.error("Error al devolver:", err);
        res.status(500).json({ msg: "Error del servidor al procesar devolución." });
    }
});

// --- SOLUCIÓN PARA RENDER  ---
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));

// --- RUTAS DE ELIMINACIÓN ADMIN (NUEVAS) ---

// 1. Eliminar Usuario
app.delete('/api/users/:id', proteger, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: "Usuario eliminado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Eliminar Préstamo
app.delete('/api/loans/:id', proteger, async (req, res) => {
    try {
        await Loan.findByIdAndDelete(req.params.id);
        // Opcional: Si borras el préstamo, podrías devolver el Stock al libro, 
        // pero por simplicidad administrativa, solo borramos el registro.
        res.json({ msg: "Préstamo eliminado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});