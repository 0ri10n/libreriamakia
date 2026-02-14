// URL de API corregida para Render
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

// ELEMENTOS DEL DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- NAVEGACIÓN INICIAL ---
document.getElementById('btnGoToLogin')?.addEventListener('click', () => {
    document.getElementById('landing-options').classList.add('hidden'); 
    loginForm.classList.remove('hidden');  
});

document.getElementById('btnGoToRegister')?.addEventListener('click', () => {
    document.getElementById('landing-options').classList.add('hidden');
    registerForm.classList.remove('hidden');
});

// --- NAVEGACIÓN PANEL USUARIO ---
document.getElementById('btnMisLibros')?.addEventListener('click', () => {
    document.getElementById('btnMisLibros').classList.add('active');
    document.getElementById('btnInicio').classList.remove('active');
    document.querySelector('.hero-section').classList.add('hidden');
    document.querySelector('.catalog-section').classList.add('hidden');
    document.getElementById('loans-section').classList.remove('hidden');
    cargarMisPrestamos();
});

document.getElementById('btnInicio')?.addEventListener('click', () => {
    document.getElementById('btnInicio').classList.add('active');
    document.getElementById('btnMisLibros').classList.remove('active');
    document.querySelector('.hero-section').classList.remove('hidden');
    document.querySelector('.catalog-section').classList.remove('hidden');
    document.getElementById('loans-section').classList.add('hidden');
    cargarCatalogo();
});

// --- NAVEGACIÓN PANEL ADMIN (BOTONES Y TABLAS) ---
document.getElementById('btnVerAdmin')?.addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario')?.addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

// Switcher de tablas en Admin
const tabs = {
    'tabLibrosAdmin': 'listaLibrosAdmin',
    'tabPrestamosAdmin': 'listaPrestamosAdmin',
    'tabUsuariosAdmin': 'listaUsuariosAdmin'
};

Object.keys(tabs).forEach(tabId => {
    document.getElementById(tabId)?.addEventListener('click', () => {
        // Ocultar todas las listas
        Object.values(tabs).forEach(id => document.getElementById(id).classList.add('hidden'));
        // Mostrar la seleccionada
        document.getElementById(tabs[tabId]).classList.remove('hidden');
        
        // Cargar datos específicos
        if(tabId === 'tabPrestamosAdmin') cargarPrestamosAdmin();
        if(tabId === 'tabUsuariosAdmin') cargarUsuariosAdmin();
    });
});

// --- GESTIÓN DE LIBROS (MODALES Y FORMULARIO) ---
document.getElementById('btnAgregarLibro')?.addEventListener('click', () => {
    document.getElementById('modalEditarLibro').classList.remove('hidden');
    document.getElementById('formEditarLibro').reset();
    document.getElementById('editBookId').value = ""; 
    document.getElementById('modalAdminTitle').innerText = "Agregar Nuevo Libro";
});

window.abrirModalEditar = function(libro) {
    document.getElementById('editBookId').value = libro._id;
    document.getElementById('editTitle').value = libro.title;
    document.getElementById('editAuthor').value = libro.author;
    document.getElementById('editStock').value = libro.Stock;
    document.getElementById('editImage').value = libro.image;
    document.getElementById('modalAdminTitle').innerText = "Editar Libro";
    document.getElementById('modalEditarLibro').classList.remove('hidden');
};

document.getElementById('formEditarLibro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editBookId').value;
    const token = localStorage.getItem('token');
    const datos = {
        title: document.getElementById('editTitle').value,
        author: document.getElementById('editAuthor').value,
        Stock: parseInt(document.getElementById('editStock').value),
        image: document.getElementById('editImage').value,
        category: "General" // Puedes agregar un input para esto si gustas
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/api/books/${id}` : `${API_URL}/api/books`;
        
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datos)
        });

        if(res.ok) {
            alert("Libro guardado con éxito");
            document.getElementById('modalEditarLibro').classList.add('hidden');
            cargarAdminDashboard();
        }
    } catch (e) { alert("Error al guardar libro"); }
});

// --- FUNCIONES DE CARGA DE DATOS (ADMIN) ---

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

        const lista = document.getElementById('listaLibrosAdmin');
        lista.innerHTML = '';
        libros.forEach(l => {
            const item = document.createElement('div');
            item.className = 'admin-list-item';
            item.innerHTML = `
                <img src="${l.image}" style="width:40px; margin-right:10px;">
                <div class="admin-item-info"><h3>${l.title}</h3><p>Stock: ${l.Stock}</p></div>
                <button onclick='abrirModalEditar(${JSON.stringify(l)})' class="btn-icon-square">Editar</button>
            `;
            lista.appendChild(item);
        });
    } catch (e) { console.error(e); }
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
    } catch (e) { lista.innerHTML = "Error al cargar usuarios"; }
}

// --- LOGICA DE SESIÓN ---
window.cerrarSesion = () => { localStorage.clear(); location.reload(); };

// Ejecutar carga inicial si ya está logueado
document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('token')) {
        document.querySelector('.main-container').classList.add('hidden');
        document.getElementById('user-dashboard').classList.remove('hidden');
        cargarCatalogo();
    }
});