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

// --- GESTIÓN DEL CATÁLOGO (CON ANIMACIONES) ---
async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    grid.innerHTML = '<p>Cargando libros...</p>';
    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') url += `&categoria=${categoria}`;

        const res = await fetch(url);
        const libros = await res.json();
        grid.innerHTML = ''; 

        libros.forEach((l, index) => {
            const div = document.createElement('div');
            div.className = 'book-card';
            div.style.animationDelay = `${index * 0.05}s`; // Animación original
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

// --- LÓGICA DE PRÉSTAMOS (USUARIO) ---
async function cargarMisPrestamos() {
    const lista = document.getElementById('listaPrestamos');
    lista.innerHTML = '<div class="loan-card"><p>Cargando tus préstamos...</p></div>';
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/loans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const prestamos = await response.json();
        lista.innerHTML = ''; 
        
        if (prestamos.length === 0) {
            lista.innerHTML = `<div style="text-align:center; padding:40px;"><p>📚 No tienes préstamos actualmente.</p></div>`;
        } else {
            prestamos.forEach((p, index) => {
                const hoy = new Date();
                const fechaDev = new Date(p.returnDate);
                const diasRestantes = Math.ceil((fechaDev - hoy) / (1000 * 60 * 60 * 24));
                const card = document.createElement('div');
                card.className = 'loan-card';
                card.style.animationDelay = `${index * 0.1}s`;
                card.innerHTML = `
                    <img src="${p.book.image || 'placeholder.jpg'}">
                    <div class="loan-info">
                        <h3>${p.book.title}</h3>
                        <p>📅 Devolver: ${fechaDev.toLocaleDateString('es-MX')}</p>
                        <span class="status-badge ${diasRestantes < 3 ? 'urgent' : ''}">${diasRestantes} días restantes</span>
                    </div>`;
                lista.appendChild(card);
            });
        }
    } catch (error) { lista.innerHTML = '<p>Error al cargar préstamos.</p>'; }
}

// --- MODAL DE PRÉSTAMO (ÉXITO/ERROR) ---
window.abrirModalPrestamo = function(libro) {
    if(libro.Stock < 1) return alert("Libro agotado");
    const modal = document.getElementById('modalPrestamo');
    modal.classList.remove('hidden');
    document.getElementById('viewLoanForm').classList.remove('hidden');
    document.getElementById('viewLoanSuccess').classList.add('hidden');
    document.getElementById('viewLoanError').classList.add('hidden');
    document.getElementById('loanBookImage').src = libro.image || 'placeholder.jpg';
    document.getElementById('loanBookTitle').value = libro.title;
    document.getElementById('loanBookId').value = libro._id;
};

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

// --- DASHBOARD ADMIN ---
async function cargarAdminDashboard() {
    const lista = document.getElementById('listaLibrosAdmin');
    const token = localStorage.getItem('token');
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

        lista.innerHTML = libros.map(libro => `
            <div class="admin-list-item">
                <img src="${libro.image}" style="width:50px; height:70px; object-fit:cover;">
                <div class="admin-item-info"><h3>${libro.title}</h3><p>${libro.author}</p></div>
                <button class="btn-icon-square" onclick='abrirModalEditar(${JSON.stringify(libro)})'>edit</button>
            </div>`).join('');
    } catch (e) { console.error(e); }
}

// Eventos de Pestañas Admin
document.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab'); 
        document.getElementById(`tab-${tabId}`).classList.add('active');
        if (tabId === 'libros') cargarAdminDashboard();
    });
});

// Filtros y Buscador
document.getElementById('containerCategorias').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});

document.getElementById('btnBuscar').addEventListener('click', () => {
    cargarCatalogo(document.getElementById('txtBusqueda').value);
});

// Navegación Dashboard Principal
document.getElementById('btnInicio').addEventListener('click', () => {
    document.querySelector('.hero-section').classList.remove('hidden');
    document.querySelector('.catalog-section').classList.remove('hidden');
    document.getElementById('loans-section').classList.add('hidden');
});

document.getElementById('btnMisLibros').addEventListener('click', () => {
    document.querySelector('.hero-section').classList.add('hidden');
    document.querySelector('.catalog-section').classList.add('hidden');
    document.getElementById('loans-section').classList.remove('hidden');
    cargarMisPrestamos();
});

document.getElementById('btnVerAdmin').addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario').addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});