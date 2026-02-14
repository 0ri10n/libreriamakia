// URL de API para Render (asegurada según tus capturas)
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

// ELEMENTOS DEL DOM
const landingOptions = document.getElementById('landing-options');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- NAVEGACIÓN ---
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

// --- LOGIN ---
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

// --- PANEL ADMINISTRATIVO (ACTUALIZA CONTADORES) ---
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

        // Actualizar números en las tarjetas moradas
        document.getElementById('statLibros').innerText = libros.length;
        document.getElementById('statPrestamos').innerText = prestamos.length;
        document.getElementById('statUsuarios').innerText = usuarios.length;

        lista.innerHTML = '';
        libros.forEach(libro => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            const libroSafe = JSON.stringify(libro).replace(/"/g, '&quot;');
            div.innerHTML = `
                <img src="${libro.image}" class="admin-item-img" style="width:60px; margin-right:15px;">
                <div class="admin-item-info">
                    <h3>${libro.title}</h3>
                    <p>${libro.author}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon-square" onclick='abrirModalEditar(${libroSafe})'>
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                </div>`;
            lista.appendChild(div);
        });
    } catch (e) {
        console.error("Error en dashboard:", e);
    }
}

// Inicializar vistas de Admin
document.getElementById('btnVerAdmin').addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario').addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

window.cerrarSesion = () => { localStorage.clear(); location.reload(); };

// Función de carga de catálogo base
async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') url += `&categoria=${categoria}`;
        const res = await fetch(url);
        const libros = await res.json();
        grid.innerHTML = ''; 
        libros.forEach(l => {
            const div = document.createElement('div');
            div.className = 'book-card';
            div.innerHTML = `<img src="${l.image}"><h4>${l.title}</h4><p>${l.author}</p>`;
            div.onclick = () => abrirModalPrestamo(l);
            grid.appendChild(div);
        });
    } catch (e) { grid.innerHTML = 'Error de carga.'; }
}