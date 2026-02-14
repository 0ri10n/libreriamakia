const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// NAVEGACIÓN DE VISTAS (Basado en tu script original)
document.getElementById('btnGoToLogin')?.addEventListener('click', () => {
    document.getElementById('landing-options').classList.add('hidden'); 
    loginForm.classList.remove('hidden');  
});

document.getElementById('btnGoToRegister')?.addEventListener('click', () => {
    document.getElementById('landing-options').classList.add('hidden');
    registerForm.classList.remove('hidden');
});

document.getElementById('backFromLogin')?.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    document.getElementById('landing-options').classList.remove('hidden'); 
});

// LOGIN Y REGISTRO
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

// FUNCIÓN PARA MOSTRAR EL CONTENIDO DESPUÉS DEL LOGIN
function entrarAlSistema() {
    document.querySelector('.stars-background')?.classList.add('hidden');
    document.querySelector('.main-container')?.classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
    cargarCatalogo();
}

// LÓGICA DE CATEGORÍAS
document.getElementById('containerCategorias')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});

async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    if (!grid) return;
    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') url += `&categoria=${categoria}`;
        const res = await fetch(url);
        const libros = await res.json();
        grid.innerHTML = libros.map(l => `
            <div class="book-card">
                <img src="${l.image || 'placeholder.jpg'}">
                <h4>${l.title}</h4>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

window.cerrarSesion = () => { localStorage.clear(); location.reload(); };