// URL de API corregida para Render
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

// ELEMENTOS DEL DOM
const landingOptions = document.getElementById('landing-options');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- NAVEGACIÓN ENTRE VISTAS ---

document.getElementById('btnGoToLogin').addEventListener('click', () => {
    landingOptions.classList.add('hidden'); 
    loginForm.classList.remove('hidden');  
});

document.getElementById('btnGoToRegister').addEventListener('click', () => {
    landingOptions.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

document.getElementById('backFromLogin').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    landingOptions.classList.remove('hidden'); 
});

document.getElementById('backFromRegister').addEventListener('click', () => {
    registerForm.classList.add('hidden');
    landingOptions.classList.remove('hidden');
});

// --- LÓGICA DE AUTENTICACIÓN ---

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', email);
            entrarAlSistema();
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error de conexión con el servidor');
    }
});

// Registro (Añadido)
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();

        if (response.ok) {
            alert('¡Cuenta creada con éxito!');
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', email);
            entrarAlSistema();
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error al registrar usuario');
    }
});

function entrarAlSistema() {
    document.querySelector('.stars-background').classList.add('hidden');
    document.querySelector('.main-container').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
    cargarCatalogo();
}

window.cerrarSesion = () => { 
    localStorage.clear(); 
    location.reload(); 
};

// --- GESTIÓN DEL CATÁLOGO ---

async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    grid.innerHTML = '<p>Cargando libros...</p>';
    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') url += `&categoria=${categoria}`;

        const res = await fetch(url);
        const libros = await res.json();
        grid.innerHTML = ''; 

        libros.forEach(l => {
            const div = document.createElement('div');
            div.className = 'book-card';
            div.innerHTML = `
                <img src="${l.image || 'placeholder.jpg'}" alt="${l.title}">
                <h4>${l.title}</h4>
                <p>${l.author}</p>
                <span class="badge">${l.ageRates || 'G'}</span>
            `;
            div.onclick = () => abrirModalPrestamo(l);
            grid.appendChild(div);
        });
    } catch (e) { grid.innerHTML = 'Error al cargar libros.'; }
}

// --- DASHBOARD ADMIN (ACTUALIZA CONTADORES Y TABLAS) ---

async function cargarAdminDashboard() {
    const lista = document.getElementById('listaLibrosAdmin');
    const token = localStorage.getItem('token');
    if (!lista) return;
    lista.innerHTML = '<p>Cargando datos maestros...</p>';

    try {
        const [resB, resL, resU] = await Promise.all([
            fetch(`${API_URL}/api/books`),
            fetch(`${API_URL}/api/loans/all`, { headers: { 'Authorization': `Bearer ${token}` }}),
            fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }})
        ]);

        const libros = await resB.json();
        const prestamos = await resL.json();
        const usuarios = await resU.json();

        // Actualizar contadores visuales
        document.getElementById('statLibros').innerText = libros.length;
        document.getElementById('statPrestamos').innerText = prestamos.length;
        document.getElementById('statUsuarios').innerText = usuarios.length;

        lista.innerHTML = '';
        libros.forEach(libro => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            const libroSafe = JSON.stringify(libro).replace(/"/g, '&quot;');
            div.innerHTML = `
                <img src="${libro.image}" style="width:50px; height:70px; object-fit:cover; margin-right:15px;">
                <div class="admin-item-info">
                    <h3>${libro.title}</h3>
                    <p>${libro.author} | Stock: ${libro.Stock}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon-square" onclick='abrirModalEditar(${libroSafe})'>
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn-icon-square" style="color:red" onclick="eliminarLibro('${libro._id}')">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>`;
            lista.appendChild(div);
        });
    } catch (e) { console.error("Error dashboard:", e); }
}

// --- FUNCIONES DE ADMINISTRACIÓN (EDITAR/ELIMINAR) ---

window.abrirModalEditar = function(libro) {
    const modal = document.getElementById('modalEditarLibro');
    document.getElementById('editBookId').value = libro._id;
    document.getElementById('editTitle').value = libro.title;
    document.getElementById('editAuthor').value = libro.author;
    document.getElementById('editStock').value = libro.Stock;
    document.getElementById('editImage').value = libro.image;
    modal.classList.remove('hidden');
};

window.eliminarLibro = async (id) => {
    if(!confirm("¿Eliminar este libro?")) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/api/books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        cargarAdminDashboard();
    } catch (e) { alert("Error al eliminar"); }
};

// --- CAMBIO DE VISTAS Y FILTROS ---

document.getElementById('btnVerAdmin').addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario').addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

// Buscador
document.getElementById('btnBuscar').addEventListener('click', () => {
    const term = document.getElementById('txtBusqueda').value;
    cargarCatalogo(term);
});

// Categorías
document.getElementById('containerCategorias').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});

// --- NAVEGACIÓN DASHBOARD (INICIO / MIS LIBROS) ---
const btnInicio = document.getElementById('btnInicio');
const btnMisLibros = document.getElementById('btnMisLibros');
const secPrestamos = document.getElementById('loans-section');

if (btnInicio && btnMisLibros) {
    btnInicio.addEventListener('click', () => {
        btnInicio.classList.add('active');
        btnMisLibros.classList.remove('active');
        document.querySelector('.hero-section').classList.remove('hidden');
        document.querySelector('.catalog-section').classList.remove('hidden');
        if(secPrestamos) secPrestamos.classList.add('hidden');
    });

    btnMisLibros.addEventListener('click', () => {
        btnMisLibros.classList.add('active');
        btnInicio.classList.remove('active');
        document.querySelector('.hero-section').classList.add('hidden');
        document.querySelector('.catalog-section').classList.add('hidden');
        if(secPrestamos) secPrestamos.classList.remove('hidden');
        cargarMisPrestamos();
    });
}

// Función para cargar los préstamos del usuario
async function cargarMisPrestamos() {
    const lista = document.getElementById('listaPrestamos');
    const token = localStorage.getItem('token');
    
    if (!lista) return;
    lista.innerHTML = '<p>Cargando préstamos...</p>';

    try {
        const res = await fetch(`${API_URL}/api/loans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar');
        
        const prestamos = await res.json();
        lista.innerHTML = '';

        if (prestamos.length === 0) {
            lista.innerHTML = '<div style="text-align:center; padding:40px;"><p>No tienes préstamos activos.</p></div>';
            return;
        }

        prestamos.forEach(p => {
            const libro = p.book || { title: 'Desconocido', image: '' };
            const fecha = new Date(p.returnDate).toLocaleDateString();
            
            const card = document.createElement('div');
            card.className = 'loan-card';
            card.innerHTML = `
                <img src="${libro.image || 'placeholder.jpg'}" alt="${libro.title}">
                <div class="loan-info">
                    <h3>${libro.title}</h3>
                    <p class="loan-desc">${libro.description || ''}</p>
                    <div class="loan-meta">
                        <span>📅 Devolver: ${fecha}</span>
                        <span class="status-badge">Activo</span>
                    </div>
                </div>`;
            lista.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        lista.innerHTML = '<p>Error de conexión al cargar préstamos.</p>';
    }
}

// --- FUNCIONES DEL PANEL DE ADMINISTRADOR ---

// 1. Mostrar formulario para AGREGAR (Limpia los campos)
window.mostrarFormAgregarLibro = function() {
    document.getElementById('formEditarLibro').reset();
    document.getElementById('editBookId').value = ''; // ID vacío indica creación
    document.getElementById('modalAdminTitle').innerText = "Agregar Libro";
    document.getElementById('previewEdit').innerHTML = '';
    document.getElementById('modalEditarLibro').classList.remove('hidden');
};

// 2. Cerrar el modal de edición
window.cerrarModalEditar = function() {
    document.getElementById('modalEditarLibro').classList.add('hidden');
};

// 3. Lógica para GUARDAR (Crear o Editar Libro)
document.getElementById('formEditarLibro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const id = document.getElementById('editBookId').value;
    
    // Recolectar datos del formulario
    const datos = {
        title: document.getElementById('editTitle').value,
        author: document.getElementById('editAuthor').value,
        category: document.getElementById('editCategory').value,
        ageRates: document.getElementById('editAgeRates').value,
        Stock: parseInt(document.getElementById('editStock').value),
        image: document.getElementById('editImage').value,
        description: document.getElementById('editDescription').value
    };

    // Determinar si es Crear (POST) o Editar (PUT)
    const url = id ? `${API_URL}/api/books/${id}` : `${API_URL}/api/books`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert(id ? "Libro actualizado" : "Libro creado");
            window.cerrarModalEditar();
            cargarAdminDashboard(); // Refrescar la tabla
            cargarCatalogo(); // Refrescar el catálogo del usuario
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || err.msg));
        }
    } catch (e) { alert("Error de conexión al guardar."); }
});

// 4. Borrado Masivo (Checkboxes)
window.confirmarBorradoMasivo = async function() {
    // Busca todos los checkboxes marcados
    const ids = Array.from(document.querySelectorAll('.select-item:checked')).map(cb => cb.dataset.id);
    
    if (ids.length === 0) return alert("Selecciona al menos un libro para borrar.");
    if (!confirm(`¿Estás seguro de borrar ${ids.length} libros?`)) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/books/batch`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ ids })
        });

        if (res.ok) {
            alert("Libros eliminados correctamente.");
            cargarAdminDashboard();
        } else {
            alert("Error al intentar borrar.");
        }
    } catch (e) { alert("Error de conexión."); }
};

// 5. Funciones visuales para botones pendientes (Préstamos/Usuarios)
window.mostrarFormAgregarPrestamo = () => document.getElementById('modalAgregarPrestamo').classList.remove('hidden');
window.mostrarFormAgregarUsuario = () => document.getElementById('modalAgregarUsuario').classList.remove('hidden');
window.confirmarBorradoMasivoPrestamos = () => alert("Función de borrado masivo de préstamos no implementada.");
window.confirmarBorradoMasivoUsuarios = () => alert("Función de borrado masivo de usuarios no implementada.");

// --- PERFIL DE USUARIO Y TEMAS ---

window.abrirModalPerfil = function() {
    const email = localStorage.getItem('userEmail') || 'Usuario';
    // Extraer nombre del email para mostrar algo amigable
    const nombre = email.split('@')[0];
    
    document.getElementById('profileName').innerText = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    document.getElementById('profileEmail').innerText = email;
    document.getElementById('modalPerfilUsuario').classList.remove('hidden');
};

window.cambiarTema = function(primary, secondary) {
    // Cambia las variables CSS globales
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    
    // Guarda la preferencia para la próxima vez
    localStorage.setItem('themePrimary', primary);
    localStorage.setItem('themeSecondary', secondary);
};

// Aplicar tema guardado al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const p = localStorage.getItem('themePrimary');
    const s = localStorage.getItem('themeSecondary');
    if (p && s) window.cambiarTema(p, s);
});


// ==========================================
// --- LÓGICA DE PRÉSTAMOS (FALTANTE) ---
// ==========================================

// 1. Botón "Solicitar Préstamo" (En la sección Mis Libros)
// Como para pedir un préstamo necesitas elegir un libro específico,
// este botón te lleva al catálogo para que selecciones uno.
const btnPedir = document.getElementById('btnPedirPrestamo');
if (btnPedir) {
    btnPedir.addEventListener('click', () => {
        // Simula clic en Inicio para ir al catálogo
        document.getElementById('btnInicio').click();
        alert("Por favor, selecciona un libro del catálogo para solicitarlo.");
    });
}

// 2. Variables del Modal
const modalPrestamo = document.getElementById('modalPrestamo');
const viewForm = document.getElementById('viewLoanForm');
const viewSuccess = document.getElementById('viewLoanSuccess');
const viewError = document.getElementById('viewLoanError');

// 3. Función para ABRIR el modal (Se llama desde las tarjetas de libros)
window.abrirModalPrestamo = function(libro) {
    // Validar Stock antes de abrir
    if (libro.Stock !== undefined && libro.Stock < 1) {
        return alert("Lo sentimos, este libro está agotado.");
    }
    
    // Mostrar el modal y el formulario
    modalPrestamo.classList.remove('hidden');
    viewForm.classList.remove('hidden');
    viewSuccess.classList.add('hidden');
    viewError.classList.add('hidden');

    // Llenar los datos del libro en el maquetado
    document.getElementById('loanBookImage').src = libro.image || 'placeholder.jpg';
    document.getElementById('loanBookTitle').value = libro.title;
    document.getElementById('loanBookId').value = libro._id;
    
    // Calcular fecha de devolución (Hoy + 15 días)
    const hoy = new Date();
    const dev = new Date();
    dev.setDate(hoy.getDate() + 15);
    document.getElementById('loanReturnDate').value = dev.toLocaleDateString('es-MX');
};

// 4. Función para CERRAR el modal
window.cerrarModalPrestamo = function() {
    modalPrestamo.classList.add('hidden');
};

// 5. Confirmar Solicitud (Enviar a la Base de Datos)
document.getElementById('btnConfirmarSolicitud').addEventListener('click', async () => {
    const bookId = document.getElementById('loanBookId').value;
    const token = localStorage.getItem('token');

    if (!token) return alert("Tu sesión expiró. Por favor inicia sesión de nuevo.");

    try {
        // Usamos API_URL como indicaste
        const res = await fetch(`${API_URL}/api/loans`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ bookId })
        });
        
        // Ocultar formulario para mostrar resultado
        viewForm.classList.add('hidden');

        if (res.ok) {
            // ÉXITO: Mostrar pantalla morada
            viewSuccess.classList.remove('hidden');
            // Recargar datos de fondo para que se actualice el stock y la lista
            cargarCatalogo(); 
            cargarMisPrestamos(); 
        } else {
            // ERROR: Mostrar pantalla de error
            const data = await res.json();
            console.error("Error préstamo:", data);
            viewError.classList.remove('hidden');
        }
    } catch (e) { 
        alert("Error de conexión con el servidor."); 
    }
});

// =========================================================
// --- LÓGICA DE PESTAÑAS Y TABLAS DEL ADMINISTRADOR ---
// =========================================================

// 1. Lógica de Pestañas (Tabs)
// Esto hace que al hacer clic en "Préstamos" o "Usuarios", cambie la vista
document.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
        // Quitar clase active de todos
        document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        // Activar el actual
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Cargar datos según la pestaña seleccionada
        if (tabId === 'libros') cargarAdminDashboard(); // Ya existente
        if (tabId === 'prestamos') cargarTablaPrestamos();
        if (tabId === 'usuarios') cargarTablaUsuarios();
    });
});

// 2. Cargar Tabla de Usuarios
async function cargarTablaUsuarios() {
    const contenedor = document.getElementById('listaUsuariosAdmin');
    const token = localStorage.getItem('token');
    
    contenedor.innerHTML = '<p style="text-align:center; padding:20px;">Cargando usuarios...</p>';

    try {
        const res = await fetch(`${API_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar usuarios');
        const usuarios = await res.json();

        contenedor.innerHTML = '';
        if (usuarios.length === 0) {
            contenedor.innerHTML = '<p style="text-align:center;">No hay usuarios registrados.</p>';
            return;
        }

        usuarios.forEach(u => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <div style="width:50px; height:50px; background:#e0ccff; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-right:15px; color:#4a0072; font-weight:bold; font-size:1.2rem;">
                    ${u.name.charAt(0).toUpperCase()}
                </div>
                <div class="admin-item-info">
                    <h3>${u.name}</h3>
                    <p>${u.email}</p>
                    <p style="font-size:0.8rem; color:#888;">ID: ${u._id}</p>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<p style="text-align:center; color:red;">Error de conexión.</p>';
    }
}

// 3. Cargar Tabla de Préstamos (Todos)
async function cargarTablaPrestamos() {
    const contenedor = document.getElementById('listaPrestamosAdmin');
    const token = localStorage.getItem('token');
    
    contenedor.innerHTML = '<p style="text-align:center; padding:20px;">Cargando préstamos...</p>';

    try {
        // Usamos el endpoint /api/loans/all que vi en tu server.js para admin
        const res = await fetch(`${API_URL}/api/loans/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al cargar préstamos');
        const prestamos = await res.json();

        contenedor.innerHTML = '';
        if (prestamos.length === 0) {
            contenedor.innerHTML = '<p style="text-align:center;">No hay préstamos activos.</p>';
            return;
        }

        prestamos.forEach(p => {
            const libro = p.book || { title: 'Libro no encontrado' };
            // Si el populate de usuario no viene, mostramos el ID
            const usuarioInfo = p.user ? (p.user.name || p.user) : 'Usuario desconocido';
            const fecha = new Date(p.returnDate).toLocaleDateString();

            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <div style="width:50px; height:50px; background:#f0fdf4; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:15px; font-size:1.5rem;">
                    📅
                </div>
                <div class="admin-item-info">
                    <h3>${libro.title}</h3>
                    <p>Usuario: ${usuarioInfo}</p>
                    <p style="font-size:0.8rem; color:#666;">Devolución: ${fecha} | ID Préstamo: ${p._id}</p>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<p style="text-align:center; color:red;">Error de conexión.</p>';
    }
}

// =========================================================
// --- GUARDAR DATOS (SOBRESCRIBIR BOTONES "ALERT") ---
// =========================================================

// 4. Lógica para botón "Guardar" en Agregar Usuario
// Buscamos el botón dentro del modal específico para asignarle la función real
const btnGuardarUsuario = document.querySelector('#modalAgregarUsuario .btn-save-header');

if (btnGuardarUsuario) {
    // Sobrescribimos el 'onclick' del HTML (el alert) con esta función real
    btnGuardarUsuario.onclick = async function() {
        // Obtenemos los inputs por posición (0: Nombre, 1: Email, 2: Password)
        const inputs = document.querySelectorAll('#modalAgregarUsuario input');
        const name = inputs[0].value;
        const email = inputs[1].value;
        const password = inputs[2].value;

        if (!name || !email || !password) return alert("Todos los campos son obligatorios");

        try {
            // Usamos la ruta /register que YA EXISTE en tu server.js
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Usuario creado correctamente");
                document.getElementById('modalAgregarUsuario').classList.add('hidden');
                
                // Limpiar campos
                inputs.forEach(i => i.value = '');
                
                // Recargar tabla si la función existe
                if (typeof cargarTablaUsuarios === 'function') cargarTablaUsuarios();
                if (typeof cargarAdminDashboard === 'function') cargarAdminDashboard();
            } else {
                alert("Error: " + data.msg);
            }
        } catch (e) { alert("Error de conexión"); }
    };
}

// 5. Lógica para botón "Guardar" en Agregar Préstamo
const btnGuardarPrestamo = document.querySelector('#modalAgregarPrestamo .btn-save-header');

if (btnGuardarPrestamo) {
    btnGuardarPrestamo.onclick = async function() {
        const inputs = document.querySelectorAll('#modalAgregarPrestamo input');
        // El input 0 es UserID, el 1 es BookID
        const userId = inputs[0].value;
        const bookId = inputs[1].value;
        const token = localStorage.getItem('token');

        if (!userId || !bookId) return alert("Se requieren ambos IDs (Usuario y Libro)");

        try {
            // Usamos la ruta /api/loans que YA EXISTE en tu server.js
            // NOTA: Tu backend espera que el usuario venga del token (req.user.id),
            // pero para admin lo ideal es pasar el ID manual.
            // Si el backend es estricto, esto creará el préstamo a nombre del ADMIN (tú).
            // Si el backend fue actualizado para aceptar 'userId' en el body, usará ese.
            
            const res = await fetch(`${API_URL}/api/loans`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bookId, userId }) 
            });

            if (res.ok) {
                alert("Préstamo creado con éxito");
                document.getElementById('modalAgregarPrestamo').classList.add('hidden');
                inputs.forEach(i => i.value = '');
                if (typeof cargarTablaPrestamos === 'function') cargarTablaPrestamos();
                if (typeof cargarAdminDashboard === 'function') cargarAdminDashboard();
            } else {
                const data = await res.json();
                alert("Error: " + (data.msg || "No se pudo crear"));
            }
        } catch (e) { alert("Error de conexión"); }
    };
}