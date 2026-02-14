// URL de API dinámica
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

const landingOptions = document.getElementById('landing-options');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- NAVEGACIÓN ORIGINAL REPARADA ---
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

// --- LÓGICA DE LOGIN ---
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

function entrarAlSistema() {
    document.querySelector('.stars-background').classList.add('hidden');
    document.querySelector('.main-container').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
    cargarCatalogo();
}

// --- CATALOGO Y CATEGORÍAS (ANIMADO) ---
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

document.getElementById('containerCategorias').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});

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

// Función para cerrar sesión original
window.cerrarSesion = function() {
    localStorage.clear();
    location.reload();
};

// ... (Aquí puedes pegar tus funciones de temas y perfil de tu script original)

// --- LÓGICA DE PERFIL Y TEMAS ---

window.abrirModalPerfil = function() {
    // Cargar datos
    const email = localStorage.getItem('userEmail') || 'usuario@makia.com';
    // Como el backend no nos da el nombre, usamos el email o un generico
    const nombre = email.split('@')[0]; 
    
    document.getElementById('profileName').innerText = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    document.getElementById('profileEmail').innerText = email;

    document.getElementById('modalPerfilUsuario').classList.remove('hidden');
};

window.cambiarTema = function(primary, secondary) {
    const root = document.documentElement;
    
    // 1. Cambiar las variables de color del tema
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--secondary-color', secondary);
    
    // 2. Calcular si el color es claro u oscuro para el texto
    const hex = primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Si es brillante (>150), texto negro. Si no, blanco.
    const textCol = brightness > 150 ? '#000000' : '#ffffff';
    root.style.setProperty('--text-on-primary', textCol);

    // 3. Guardar preferencia
    localStorage.setItem('themePrimary', primary);
    localStorage.setItem('themeSecondary', secondary);
};

// Cargar tema guardado al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedPrimary = localStorage.getItem('themePrimary');
    const savedSecondary = localStorage.getItem('themeSecondary');
    
    if (savedPrimary && savedSecondary) {
        cambiarTema(savedPrimary, savedSecondary);
    }
});