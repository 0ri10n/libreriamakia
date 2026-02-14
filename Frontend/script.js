// URL de API dinámica
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const landingOptions = document.getElementById('landing-options');

// --- NAVEGACIÓN ORIGINAL REPARADA ---
document.getElementById('btnGoToLogin')?.addEventListener('click', () => {
    landingOptions.classList.add('hidden'); 
    loginForm.classList.remove('hidden');  
});

document.getElementById('btnGoToRegister')?.addEventListener('click', () => {
    landingOptions.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

document.getElementById('backFromLogin')?.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    landingOptions.classList.remove('hidden'); 
});

document.getElementById('backFromRegister')?.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    landingOptions.classList.remove('hidden');
});

// --- LÓGICA DE LOGIN ---
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
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', email);
            entrarAlSistema();
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error de conexión');
    }
});

function entrarAlSistema() {
    document.querySelector('.stars-background')?.classList.add('hidden');
    document.querySelector('.main-container')?.classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
    cargarCatalogo();
}

// --- CATALOGO CON ANIMACIONES ---
async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    if (!grid) return;
    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') url += `&categoria=${categoria}`;
        const res = await fetch(url);
        const libros = await res.json();
        grid.innerHTML = libros.map((l, index) => `
            <div class="book-card" style="animation-delay: ${index * 0.05}s" onclick='abrirModalPrestamo(${JSON.stringify(l)})'>
                <img src="${l.image || 'placeholder.jpg'}">
                <h4>${l.title}</h4>
                <p>${l.author}</p>
                <span class="badge">${l.ageRates || 'G'}</span>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

// --- DASHBOARD ADMIN Y TABS ---
document.getElementById('btnVerAdmin')?.addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario')?.addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

window.cerrarSesion = () => { localStorage.clear(); location.reload(); };