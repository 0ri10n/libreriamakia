// URL de API corregida para Render
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

// ELEMENTOS PRINCIPALES
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- 1. LÓGICA DE LOGIN (CORREGIDA PARA QUE AVANCE) ---
loginForm?.addEventListener('submit', async (e) => {
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
            // Guardar datos de sesión
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', data.user?.role || 'user');

            // ACTIVAR CAMBIO DE PANTALLA
            entrarAlSistema();
        } else {
            alert('Error: ' + (data.msg || 'Credenciales incorrectas'));
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert('Error de conexión con el servidor');
    }
});

// Función vital para pasar del login a la biblioteca
function entrarAlSistema() {
    const mainContainer = document.querySelector('.main-container');
    const starsBg = document.querySelector('.stars-background');
    const userDashboard = document.getElementById('user-dashboard');

    // Ocultar acceso y mostrar biblioteca
    starsBg?.classList.add('hidden');
    mainContainer?.classList.add('hidden');
    
    if (userDashboard) {
        userDashboard.classList.remove('hidden');
        cargarCatalogo(); // Carga inicial de libros
    } else {
        console.error("Error: No se encontró 'user-dashboard' en el HTML.");
    }
}

// --- 2. NAVEGACIÓN DE PESTAÑAS (USUARIO) ---
document.getElementById('btnMisLibros')?.addEventListener('click', () => {
    activarSeccionUsuario('loans-section', 'btnMisLibros');
    cargarMisPrestamos();
});

document.getElementById('btnInicio')?.addEventListener('click', () => {
    activarSeccionUsuario('catalog-section', 'btnInicio');
    document.querySelector('.hero-section')?.classList.remove('hidden');
    cargarCatalogo();
});

function activarSeccionUsuario(idSeccion, idBoton) {
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    document.getElementById(idBoton)?.classList.add('active');
    
    document.querySelector('.hero-section')?.classList.add('hidden');
    document.querySelector('.catalog-section')?.classList.add('hidden');
    document.getElementById('loans-section')?.classList.add('hidden');
    
    document.getElementById(idSeccion)?.classList.remove('hidden');
}

// --- 3. LÓGICA DE CATEGORÍAS ---
document.getElementById('containerCategorias')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        const cat = e.target.dataset.cat;
        cargarCatalogo('', cat);
    }
});

// --- 4. PANEL ADMINISTRATIVO ---
document.getElementById('btnVerAdmin')?.addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario')?.addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

// Switcher de Tablas dentro de Admin
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
    tablas.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.getElementById(idLista)?.classList.remove('hidden');
}

// --- 5. GESTIÓN DE LIBROS ---
document.getElementById('btnAgregarLibro')?.addEventListener('click', () => {
    document.getElementById('modalEditarLibro').classList.remove('hidden');
    document.getElementById('formEditarLibro').reset();
    document.getElementById('editBookId').value = ""; 
    document.getElementById('modalAdminTitle').innerText = "Agregar Nuevo Libro";
});

window.cerrarModalEditar = () => document.getElementById('modalEditarLibro').classList.add('hidden');

// --- 6. FUNCIONES DE CARGA (FETCH) ---

async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    if (!grid) return;
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

async function cargarAdminDashboard() {
    const token = localStorage.getItem('token');
    try {
        const [resB, resL, resU] = await Promise.all([
            fetch(`${API_URL}/api/books`),
            fetch(`${API_URL}/api/loans/all`, { headers: { 'Authorization': `Bearer ${token}` }}),
            fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }})
        ]);

        const libros = await resB.json();
        document.getElementById('statLibros').innerText = libros.length;
        document.getElementById('statPrestamos').innerText = (await resL.json()).length;
        document.getElementById('statUsuarios').innerText = (await resU.json()).length;
    } catch (e) { console.error("Error dashboard", e); }
}

// --- 7. NAVEGACIÓN INICIAL Y SESIÓN ---
document.getElementById('btnGoToLogin')?.addEventListener('click', () => {
    document.getElementById('landing-options').classList.add('hidden'); 
    loginForm.classList.remove('hidden');  
});

window.cerrarSesion = () => { 
    localStorage.clear(); 
    location.reload(); 
};