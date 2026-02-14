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