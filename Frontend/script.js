// URL Dinámica para conectar con Render (Asegurada con -3p4u según tus capturas)
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

// ELEMENTOS DEL DOM
const landingOptions = document.getElementById('landing-options');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- NAVEGACIÓN ENTRE VISTAS PRINCIPALES ---

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
            document.querySelector('.stars-background').classList.add('hidden');
            document.querySelector('.main-container').classList.add('hidden');
            document.getElementById('user-dashboard').classList.remove('hidden');
            cargarCatalogo();
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error de conexión con el servidor');
    }
});

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
            localStorage.setItem('token', data.token);
            alert('¡Cuenta creada con éxito!');
            document.querySelector('.stars-background').classList.add('hidden');
            document.querySelector('.main-container').classList.add('hidden');
            document.getElementById('user-dashboard').classList.remove('hidden');
            cargarCatalogo();
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error de conexión');
    }
});

window.cerrarSesion = () => {
    localStorage.clear();
    location.reload();
};

// --- FUNCIONES DEL CATÁLOGO (VISTA USUARIO) ---

async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    grid.innerHTML = '<p>Cargando biblioteca...</p>';
    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') url += `&categoria=${categoria}`;

        const response = await fetch(url);
        const libros = await response.json();

        grid.innerHTML = ''; 
        libros.forEach((libro, index) => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.style.animationDelay = `${index * 0.05}s`; 
            card.innerHTML = `
                <img src="${libro.image || 'placeholder.jpg'}" alt="${libro.title}">
                <h4>${libro.title}</h4>
                <p>${libro.author}</p>
                <span class="badge">${libro.ageRates || 'Todo público'}</span>
            `;
            card.onclick = () => abrirModalPrestamo(libro);
            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = '<p>Error al conectar con la biblioteca.</p>';
    }
}

// Filtros por categoría
document.getElementById('containerCategorias').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});

// Buscador
document.getElementById('btnBuscar').addEventListener('click', () => {
    const term = document.getElementById('txtBusqueda').value;
    cargarCatalogo(term);
});

// --- GESTIÓN DE PRÉSTAMOS (USUARIO) ---

async function cargarMisPrestamos() {
    const lista = document.getElementById('listaPrestamos');
    lista.innerHTML = '<p>Cargando tus libros...</p>';
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/api/loans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const prestamos = await response.json();
        lista.innerHTML = '';

        if (prestamos.length === 0) {
            lista.innerHTML = '<p>No tienes libros en préstamo actualmente.</p>';
            return;
        }

        prestamos.forEach((p, index) => {
            const libro = p.book;
            const card = document.createElement('div');
            card.className = 'loan-card';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <img src="${libro.image}" alt="${libro.title}">
                <div class="loan-info">
                    <h3>${libro.title}</h3>
                    <p class="loan-desc">${libro.description || 'Sin descripción.'}</p>
                    <button onclick="devolverLibro('${p._id}')" class="btn-action">Devolver Libro</button>
                </div>`;
            lista.appendChild(card);
        });
    } catch (e) { lista.innerHTML = '<p>Error al cargar tus préstamos.</p>'; }
}

window.devolverLibro = async (id) => {
    const token = localStorage.getItem('token');
    if(!confirm("¿Deseas devolver este libro?")) return;
    try {
        const res = await fetch(`${API_URL}/api/loans/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert("Libro devuelto correctamente");
            cargarMisPrestamos();
            cargarCatalogo();
        }
    } catch (e) { alert("Error al devolver el libro"); }
};

// Modal Préstamo
window.abrirModalPrestamo = function(libro) {
    if(libro.Stock < 1) return alert("Libro agotado actualmente");
    
    document.getElementById('modalPrestamo').classList.remove('hidden');
    document.getElementById('viewLoanForm').classList.remove('hidden');
    document.getElementById('viewLoanSuccess').classList.add('hidden');
    document.getElementById('viewLoanError').classList.add('hidden');

    document.getElementById('loanBookImage').src = libro.image;
    document.getElementById('loanBookTitle').value = libro.title;
    document.getElementById('loanBookId').value = libro._id;
    
    const dev = new Date();
    dev.setDate(dev.getDate() + 15);
    document.getElementById('loanReturnDate').value = dev.toLocaleDateString('es-MX');
};

window.cerrarModalPrestamo = () => document.getElementById('modalPrestamo').classList.add('hidden');

document.getElementById('btnConfirmarSolicitud').addEventListener('click', async () => {
    const bookId = document.getElementById('loanBookId').value;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/loans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ bookId })
        });
        document.getElementById('viewLoanForm').classList.add('hidden');
        if (res.ok) {
            document.getElementById('viewLoanSuccess').classList.remove('hidden');
            cargarCatalogo();
        } else {
            document.getElementById('viewLoanError').classList.remove('hidden');
        }
    } catch (e) { alert("Error de conexión"); }
});

// --- PANEL ADMINISTRATIVO ---

async function cargarAdminDashboard() {
    const lista = document.getElementById('listaLibrosAdmin');
    const token = localStorage.getItem('token');
    lista.innerHTML = '<p style="text-align:center">Cargando datos maestros...</p>';

    try {
        const [resB, resL, resU] = await Promise.all([
            fetch(`${API_URL}/api/books`),
            fetch(`${API_URL}/api/loans/all`, { headers: { 'Authorization': `Bearer ${token}` }}),
            fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }})
        ]);

        const libros = await resB.json();
        const prestamos = await resL.json();
        const usuarios = await resU.json();

        document.getElementById('statLibros').innerText = libros.length;
        document.getElementById('statPrestamos').innerText = prestamos.length;
        document.getElementById('statUsuarios').innerText = usuarios.length;

        lista.innerHTML = '';
        libros.forEach(libro => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            const libroSafe = JSON.stringify(libro).replace(/"/g, '&quot;');
            div.innerHTML = `
                <input type="checkbox" class="select-item" data-id="${libro._id}" style="margin-right:15px; transform: scale(1.2);">
                <img src="${libro.image}" class="admin-item-img" style="width:60px; height:80px; object-fit:cover; margin-right:15px;">
                <div class="admin-item-info">
                    <h3>${libro.title}</h3>
                    <p>Stock: ${libro.Stock} | ${libro.author}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon-square" onclick='abrirModalEditar(${libroSafe})'>
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                </div>`;
            lista.appendChild(div);
        });
    } catch (e) { lista.innerHTML = '<p>Error de conexión administrativa.</p>'; }
}

async function cargarPrestamosAdmin() {
    const lista = document.getElementById('listaPrestamosAdmin');
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/loans/all`, { headers: { 'Authorization': `Bearer ${token}` }});
        const data = await res.json();
        lista.innerHTML = '';
        data.forEach(p => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <div style="margin-right:20px; font-size:1.5rem;">📅</div>
                <div class="admin-item-info">
                    <h3>${p.book ? p.book.title : 'Libro no encontrado'}</h3>
                    <p>Devolución: ${new Date(p.returnDate).toLocaleDateString()}</p>
                </div>`;
            lista.appendChild(div);
        });
    } catch (e) { lista.innerHTML = '<p>Error al cargar préstamos.</p>'; }
}

async function cargarUsuariosAdmin() {
    const lista = document.getElementById('listaUsuariosAdmin');
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }});
        const data = await res.json();
        lista.innerHTML = '';
        data.forEach(u => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <div style="margin-right:20px; font-size:1.5rem;">👤</div>
                <div class="admin-item-info">
                    <h3>${u.name}</h3>
                    <p>${u.email}</p>
                </div>`;
            lista.appendChild(div);
        });
    } catch (e) { lista.innerHTML = '<p>Error al cargar usuarios.</p>'; }
}

// --- EDICIÓN Y CREACIÓN DE LIBROS ---

const modalEdit = document.getElementById('modalEditarLibro');
let editandoId = null;

window.mostrarFormAgregarLibro = function() {
    editandoId = null; 
    document.getElementById('formEditarLibro').reset();
    document.getElementById('modalAdminTitle').innerText = "Agregar Libro";
    document.getElementById('previewEdit').innerHTML = '';
    modalEdit.classList.remove('hidden');
};

window.abrirModalEditar = function(libro) {
    editandoId = libro._id;
    document.getElementById('modalAdminTitle').innerText = "Editar Libro";
    document.getElementById('editTitle').value = libro.title;
    document.getElementById('editAuthor').value = libro.author;
    document.getElementById('editCategory').value = libro.category;
    document.getElementById('editStock').value = libro.Stock;
    document.getElementById('editImage').value = libro.image;
    document.getElementById('editDescription').value = libro.description || '';
    document.getElementById('editAgeRates').value = libro.ageRates || 'Todo Público';
    document.getElementById('previewEdit').innerHTML = `<img src="${libro.image}" style="max-height:100%;">`;
    modalEdit.classList.remove('hidden');
};

window.cerrarModalEditar = () => modalEdit.classList.add('hidden');

document.getElementById('formEditarLibro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const datos = {
        title: document.getElementById('editTitle').value,
        author: document.getElementById('editAuthor').value,
        category: document.getElementById('editCategory').value,
        Stock: parseInt(document.getElementById('editStock').value),
        image: document.getElementById('editImage').value,
        description: document.getElementById('editDescription').value,
        ageRates: document.getElementById('editAgeRates').value
    };
    const url = editandoId ? `${API_URL}/api/books/${editandoId}` : `${API_URL}/api/books`;
    const method = editandoId ? 'PUT' : 'POST';
    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datos)
        });
        if(res.ok) {
            alert("Cambios guardados");
            cerrarModalEditar();
            cargarAdminDashboard();
        }
    } catch (e) { alert("Error al guardar"); }
});

// --- PERFIL Y TEMAS ---

window.abrirModalPerfil = function() {
    const email = localStorage.getItem('userEmail') || 'usuario@makia.com';
    document.getElementById('profileName').innerText = email.split('@')[0].toUpperCase();
    document.getElementById('profileEmail').innerText = email;
    document.getElementById('modalPerfilUsuario').classList.remove('hidden');
};

window.cambiarTema = function(primary, secondary) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--secondary-color', secondary);
    localStorage.setItem('themePrimary', primary);
    localStorage.setItem('themeSecondary', secondary);
};

// --- EVENTOS DE BOTONES ---

document.getElementById('btnVerAdmin').addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario').addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

document.getElementById('btnInicio').addEventListener('click', () => {
    document.getElementById('btnInicio').classList.add('active');
    document.getElementById('btnMisLibros').classList.remove('active');
    document.querySelector('.hero-section').classList.remove('hidden');
    document.querySelector('.catalog-section').classList.remove('hidden');
    document.getElementById('loans-section').classList.add('hidden');
});

document.getElementById('btnMisLibros').addEventListener('click', () => {
    document.getElementById('btnMisLibros').classList.add('active');
    document.getElementById('btnInicio').classList.remove('active');
    document.querySelector('.hero-section').classList.add('hidden');
    document.querySelector('.catalog-section').classList.add('hidden');
    document.getElementById('loans-section').classList.remove('hidden');
    cargarMisPrestamos();
});

// Cargar tema al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedP = localStorage.getItem('themePrimary');
    const savedS = localStorage.getItem('themeSecondary');
    if (savedP && savedS) cambiarTema(savedP, savedS);
});