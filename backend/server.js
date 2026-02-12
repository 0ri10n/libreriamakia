require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Para permitir conexión con el Frontend
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// IMPORTAR CONEXIÓN Y MODELOS
const connectDB = require('./mongoose');
const User = require('./models/users');
const Book = require('./models/books'); 
const Loan = require('./models/loans'); // Verifica préstamos

// IMPORTAR MIDDLEWARE DE SEGURIDAD 
const proteger = require('./middleware/authMiddleware');

// INICIALIZAR APP Y BD 
const app = express();
connectDB();

// MIDDLEWARES GLOBALES 
app.use(cors());          // Permite peticiones desde cualquier origen (Frontend)
app.use(express.json());  // Permite leer datos JSON en las peticiones (req.body)

// Servir archivos estáticos de la carpeta Frontend
app.use(express.static(path.join(__dirname, '../Frontend')));

// RUTAS DE AUTENTICACIÓN (LOGIN/REGISTER)
// Login de Usuario
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Verificar si existe el usuario
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Usuario no encontrado' });

    // Verificar contraseña
    const esCorrecta = await bcrypt.compare(password, user.password);
    if (!esCorrecta) return res.status(400).json({ msg: 'Contraseña incorrecta' });

    // Generar Token
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, (err, token) => {
        if (err) throw err;
        res.json({ token });
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ msg: 'Error en el servidor: ' + err.message });
  }
});

// Registro de Usuario
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'El usuario ya existe' });

    user = new User({ name, email, password });
    await user.save(); // La encriptación se hace en el modelo users.js

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ token, msg: 'Usuario registrado con éxito' });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor: ' + err.message });
  }
});

// RUTAS DE LIBROS (API RESTFUL)
// OBTENER LIBROS (Público - Con Filtros y Búsqueda)
app.get('/api/books', async (req, res) => {
  try {
    const { busqueda, categoria } = req.query;
    let query = {}; 

    // Lógica de Búsqueda (Barra de búsqueda: Título o Autor)
    if (busqueda) {
      query.$or = [
        { title: { $regex: busqueda, $options: 'i' } }, // 'i' ignora mayúsculas
        { author: { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Lógica de Filtro (Botones de Categoría)
    if (categoria) {
      query.category = categoria;
    }

    const books = await Book.find(query);
    res.json(books);

  } catch (err) {
    res.status(500).json({ error: "Error al obtener libros: " + err.message });
  }
});

// CREAR LIBRO (Protegido - Solo Admin Logueado)
app.post('/api/books', proteger, async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    // Error 400 si faltan datos requeridos o stock negativo
    res.status(400).json({ error: err.message });
  }
});

// EDITAR LIBRO (Protegido)
app.put('/api/books/:id', proteger, async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBook) return res.status(404).json({ msg: "Libro no encontrado" });
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ error: "Error al actualizar: " + err.message });
  }
});

// ELIMINAR UN SOLO LIBRO (Protegido - Con validación de Préstamo)
app.delete('/api/books/:id', proteger, async (req, res) => {
  try {
    // SEGURIDAD: Verificar si el libro está prestado
    const prestamoActivo = await Loan.findOne({ book: req.params.id });
    
    if (prestamoActivo) {
        return res.status(400).json({ 
            msg: "No se puede eliminar este libro porque está prestado actualmente." 
        });
    }

    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) return res.status(404).json({ msg: "Libro no encontrado" });
    
    res.json({ message: "Libro eliminado correctamente" });

  } catch (err) {
    res.status(500).json({ error: "Error al eliminar: " + err.message });
  }
});

// ELIMINAR VARIOS LIBROS (Bulk Delete - Protegido)
app.delete('/api/books/batch', proteger, async (req, res) => {
  try {
    const { ids } = req.body; 
    
    // Validación básica
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ msg: "No seleccionaste ningún libro para borrar." });
    }

    // SEGURIDAD: Verificar si ALGUNO de los libros seleccionados tiene préstamos activos
    const librosPrestados = await Loan.find({ book: { $in: ids } });

    if (librosPrestados.length > 0) {
      return res.status(400).json({ 
        msg: `Operación cancelada: ${librosPrestados.length} de los libros seleccionados están prestados y no se pueden borrar.` 
      });
    }

    // Si nadie los tiene prestados, procedemos a borrar todos
    const result = await Book.deleteMany({ _id: { $in: ids } });

    res.json({ 
      msg: `${result.deletedCount} libros eliminados correctamente.`,
      deletedCount: result.deletedCount
    });

  } catch (err) {
    res.status(500).json({ error: "Error en borrado masivo: " + err.message });
  }
});

// RUTAS DE VISTAS (FRONTEND)
// Ruta principal para servir la Single Page Application (SPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

// INICIAR SERVIDOR

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));