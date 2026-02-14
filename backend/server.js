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

// IMPORTAR MIDDLEWARE DE SEGURIDAD 
const proteger = require('./middleware/authMiddleware');

// INICIALIZAR APP Y BD 
const app = express();
connectDB();

// MIDDLEWARES GLOBALES 
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

// MIDDLEWARE INTERNO PARA VERIFICAR SI ES ADMIN 
// Se usa después de 'proteger' para rutas delicadas
const esAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Acceso denegado: Se requieren permisos de Administrador' });
        }
        next();
    } catch (error) {
        res.status(500).json({ msg: 'Error al verificar permisos' });
    }
};

// RUTAS DE AUTENTICACIÓN
// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

    const esCorrecta = await bcrypt.compare(password, user.password);
    if (!esCorrecta) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    const payload = { user: { id: user.id } };
    
    // IMPORTANTE: Enviamos el token Y el rol
    jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role }); 
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor: ' + err.message });
  }
});

// Registro (Público - Crea usuarios normales)
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'El usuario ya existe' });

    user = new User({ name, email, password }); // role: 'user' por defecto
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ token, msg: 'Usuario registrado con éxito' });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor: ' + err.message });
  }
});

// GESTIÓN DE LIBROS (BOOKS)
// Obtener libros (Público - Con Buscador y Filtros)
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
    if (categoria) query.category = categoria;

    const books = await Book.find(query);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener libros" });
  }
});

// Crear Libro (SOLO ADMIN)
app.post('/api/books', proteger, esAdmin, async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Editar Libro (SOLO ADMIN)
app.put('/api/books/:id', proteger, esAdmin, async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBook) return res.status(404).json({ msg: "Libro no encontrado" });
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar un Libro (SOLO ADMIN - Verifica préstamos)
app.delete('/api/books/:id', proteger, esAdmin, async (req, res) => {
  try {
    const prestamoActivo = await Loan.findOne({ book: req.params.id });
    if (prestamoActivo) {
        return res.status(400).json({ msg: "No se puede eliminar: el libro está prestado." });
    }
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) return res.status(404).json({ msg: "Libro no encontrado" });
    res.json({ message: "Libro eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar Varios Libros (SOLO ADMIN)
app.delete('/api/books/batch', proteger, esAdmin, async (req, res) => {
  try {
    const { ids } = req.body; 
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ msg: "Selecciona libros para borrar." });
    }

    const librosPrestados = await Loan.find({ book: { $in: ids } });
    if (librosPrestados.length > 0) {
      return res.status(400).json({ msg: `Error: ${librosPrestados.length} libros están prestados.` });
    }

    const result = await Book.deleteMany({ _id: { $in: ids } });
    res.json({ msg: `${result.deletedCount} libros eliminados.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GESTIÓN DE PRÉSTAMOS (LOANS)
// GET: Ver Préstamos (Inteligente)
// Si es Admin ve TODOS. Si es Usuario ve LOS SUYOS.
app.get('/api/loans', proteger, async (req, res) => {
    try {
        const usuario = await User.findById(req.user.id);
        let query = {};

        if (usuario.role !== 'admin') {
            query.user = req.user.id;
        }

        // Populate trae los datos completos del libro y usuario
        const loans = await Loan.find(query)
            .populate('book')
            .populate('user', 'name email'); 

        res.json(loans);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener préstamos' });
    }
});

// POST: Crear Préstamo (Baja Stock)
app.post('/api/loans', proteger, async (req, res) => {
    const { bookId } = req.body;
    try {
        // 1. Verificar libro y stock
        const libro = await Book.findById(bookId);
        if (!libro) return res.status(404).json({ msg: 'Libro no encontrado' });
        if (libro.stock < 1) return res.status(400).json({ msg: 'Libro agotado' });

        // 2. Verificar duplicidad (opcional)
        const prestamoExistente = await Loan.findOne({ book: bookId, user: req.user.id });
        if (prestamoExistente) return res.status(400).json({ msg: 'Ya tienes este libro prestado' });

        // 3. Calcular fecha devolución (15 días)
        const fechaDevolucion = new Date();
        fechaDevolucion.setDate(fechaDevolucion.getDate() + 15);

        // 4. Crear Préstamo
        const nuevoPrestamo = new Loan({
            book: bookId,
            user: req.user.id,
            loanDate: Date.now(),
            returnDate: fechaDevolucion
        });

        // 5. Guardar y RESTAR STOCK
        await nuevoPrestamo.save();
        libro.stock -= 1;
        await libro.save();

        res.json(nuevoPrestamo);
    } catch (err) {
        res.status(500).json({ error: 'Error al procesar préstamo' });
    }
});

// DELETE: Devolver Libro (Sube Stock)
app.delete('/api/loans/:id', proteger, async (req, res) => {
    try {
        const prestamo = await Loan.findById(req.params.id);
        if (!prestamo) return res.status(404).json({ msg: 'Préstamo no encontrado' });

        // Verificar permisos (Solo Admin o el dueño del préstamo)
        const usuarioSolicitante = await User.findById(req.user.id);
        if (usuarioSolicitante.role !== 'admin' && prestamo.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        // 1. Subir Stock
        const libro = await Book.findById(prestamo.book);
        if (libro) {
            libro.stock += 1;
            await libro.save();
        }

        // 2. Borrar Préstamo
        await Loan.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Libro devuelto exitosamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al devolver libro' });
    }
});

// DELETE BATCH: Borrado Masivo de Préstamos (Solo Admin)
app.delete('/api/loans/batch', proteger, esAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) return res.status(400).json({ msg: "Selecciona préstamos." });

        const prestamos = await Loan.find({ _id: { $in: ids } });

        // Restaurar stock de cada libro involucrado
        for (const prestamo of prestamos) {
            await Book.findByIdAndUpdate(prestamo.book, { $inc: { stock: 1 } });
        }

        const result = await Loan.deleteMany({ _id: { $in: ids } });
        res.json({ msg: `${result.deletedCount} préstamos eliminados y stock restaurado.` });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. GESTIÓN DE USUARIOS (ADMIN)
// GET: Lista de Usuarios (Sin passwords)
app.get('/api/users', proteger, esAdmin, async (req, res) => {
    try {
        const usuarios = await User.find().select('-password');
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// POST: Crear Usuario (Admin)
app.post('/api/users', proteger, esAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'El usuario ya existe' });

        user = new User({ name, email, password, role: role || 'user' });
        await user.save(); 

        res.json({ msg: 'Usuario creado correctamente', user: { name, email, role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE BATCH: Eliminar Usuarios (Admin)
app.delete('/api/users/batch', proteger, esAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) return res.status(400).json({ msg: "Selecciona usuarios." });

        if (ids.includes(req.user.id)) {
            return res.status(400).json({ msg: "No puedes borrar tu propia cuenta." });
        }

        const result = await User.deleteMany({ _id: { $in: ids } });
        res.json({ msg: `${result.deletedCount} usuarios eliminados.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SERVIDOR
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../Frontend', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));