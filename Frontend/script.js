// URL de API corregida para Render
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

// ELEMENTOS PRINCIPALES
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- 1. NAVEGACIÓN DE PESTAÑAS (USUARIO) ---
// Arregla el problema de "Mis Libros" y el cambio de secciones
document.getElementById('btnMisLibros')?.addEventListener('click', () => {
    activarSeccionUsuario('loans-section', 'btnMisLibros');
    cargarMisPrestamos();
});

document.getElementById('btnInicio')?.addEventListener('click', () => {
    activarSeccionUsuario('catalog-section', 'btnInicio');
    document.querySelector('.hero-section').classList.remove('hidden');
    cargarCatalogo();
});

function activarSeccionUsuario(idSeccion, idBoton) {
    // Gestionar botones activos
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(idBoton)?.classList.add('active');
    
    // Ocultar todas las secciones de contenido
    document.querySelector('.hero-section').classList.add('hidden');
    document.querySelector('.catalog-section').classList.add('hidden');
    document.getElementById('loans-section').classList.add('hidden');
    
    // Mostrar la elegida
    document.getElementById(idSeccion).classList.remove('hidden');
}

// --- 2. LÓGICA DE CATEGORÍAS (FILTRADO) ---
// Detecta el clic en las etiquetas (Terror, Fantasía, etc.)
document.getElementById('containerCategorias')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        const cat = e.target.dataset.cat; // Usa el atributo data-cat del HTML
        cargarCatalogo('', cat);
    }
});

// --- 3. PANEL ADMINISTRATIVO (CAMBIO DE TABLAS) ---
// Entrar y Salir del Panel Admin
document.getElementById('btnVerAdmin')?.addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario')?.addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

// Switcher de Tablas dentro de Admin (Libros / Préstamos / Usuarios)
document.getElementById('tabLibrosAdmin')?.addEventListener('click', () => mostrarTablaAdmin('listaLibrosAdmin'));
document.getElementById('tabPrestamosAdmin')?.addEventListener('click', () => {
    mostrarTablaAdmin('listaPrestamosAdmin');
    cargarPrestamosAdmin();
});
document.getElementById('tabUsuariosAdmin')?.addEventListener('click', () => {
    mostrarTablaAdmin('listaUsuariosAdmin');
    cargarUsuariosAdmin();
});

function mostrarTablaAdmin(idLista) {
    const tablas = ['listaLibrosAdmin', 'listaPrestamosAdmin', 'listaUsuariosAdmin'];
    tablas.forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(idLista).classList.remove('hidden');
}

// --- 4. GESTIÓN DE LIBROS (MODAL AGREGAR) ---
document.getElementById('btnAgregarLibro')?.addEventListener('click', () => {
    document.getElementById('modalEditarLibro').classList.remove('hidden');
    document.getElementById('formEditarLibro').reset();
    document.getElementById('editBookId').value = ""; 
    document.getElementById('modalAdminTitle').innerText = "Agregar Nuevo Libro";
});

window.cerrarModalEditar = () => document.getElementById('modalEditarLibro').classList.add('hidden');

// --- 5. FUNCIONES DE CARGA DE DATOS (FETCH) ---

async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') url += `&categoria=${categoria}`;
        const res = await fetch(url);
        const libros = await res.json();
        grid.innerHTML = libros.map(l => `
            <div class="book-card" onclick='abrirModalPrestamo(${JSON.stringify(l)})'>
                <img src="${l.image || 'placeholder.jpg'}">
                <h4>${l.title}</h4>
                <p>${l.author}</p>
            </div>
        `).join('');
    } catch (e) { console.error("Error catálogo", e); }
}

async function cargarUsuariosAdmin() {
    const lista = document.getElementById('listaUsuariosAdmin');
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }});
        const users = await res.json();
        lista.innerHTML = users.map(u => `
            <div class="admin-list-item">
                <div class="admin-item-info"><h3>${u.name}</h3><p>${u.email}</p></div>
                <span class="badge">${u.role}</span>
            </div>
        `).join('');
    } catch (e) { lista.innerHTML = "Error al cargar usuarios."; }
}

async function cargarPrestamosAdmin() {
    const lista = document.getElementById('listaPrestamosAdmin');
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/loans/all`, { headers: { 'Authorization': `Bearer ${token}` }});
        const loans = await res.json();
        lista.innerHTML = loans.map(l => `
            <div class="admin-list-item">
                <div class="admin-item-info">
                    <h3>${l.book?.title || 'Libro eliminado'}</h3>
                    <p>Usuario: ${l.user?.email || 'N/A'}</p>
                </div>
            </div>
        `).join('');
    } catch (e) { lista.innerHTML = "Error al cargar préstamos."; }
}

// --- 6. AUTENTICACIÓN INICIAL ---
document.getElementById('btnGoToLogin')?.addEventListener('click', () => {
    document.getElementById('landing-options').classList.add('hidden'); 
    loginForm.classList.remove('hidden');  
});

window.cerrarSesion = () => { localStorage.clear(); location.reload(); };