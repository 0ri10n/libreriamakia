// URL de API dinámica
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

window.cerrarSesion = () => { 
    localStorage.clear(); 
    location.reload(); 
};

// --- GESTIÓN DEL CATÁLOGO ---
async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    if (!grid) return;
    grid.innerHTML = '<p>Cargando libros...</p>';

    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') {
            url += `&categoria=${categoria}`;
        }

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

document.getElementById('containerCategorias')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});

document.getElementById('btnBuscar')?.addEventListener('click', () => {
    const term = document.getElementById('txtBusqueda').value;
    cargarCatalogo(term);
});

// --- NAVEGACIÓN DASHBOARD ---
const btnInicio = document.getElementById('btnInicio');
const btnMisLibros = document.getElementById('btnMisLibros');
const secPrestamos = document.getElementById('loans-section');

btnInicio?.addEventListener('click', () => {
    btnInicio.classList.add('active');
    btnMisLibros?.classList.remove('active');
    document.querySelector('.hero-section').classList.remove('hidden');
    document.querySelector('.catalog-section').classList.remove('hidden');
    secPrestamos?.classList.add('hidden');
});

btnMisLibros?.addEventListener('click', () => {
    btnMisLibros.classList.add('active');
    btnInicio?.classList.remove('active');
    document.querySelector('.hero-section').classList.add('hidden');
    document.querySelector('.catalog-section').classList.add('hidden');
    secPrestamos?.classList.remove('hidden');
    cargarMisPrestamos();
});

// --- CARGAR PRÉSTAMOS REALES ---
async function cargarMisPrestamos() {
    const lista = document.getElementById('listaPrestamos');
    if (!lista) return;
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
                        <p>${p.book.description || 'Sin descripción'}</p>
                        <div class="loan-meta">
                            <span>📅 Devolver: ${fechaDev.toLocaleDateString('es-MX')}</span>
                            <span class="status-badge ${diasRestantes < 3 ? 'urgent' : ''}">${diasRestantes} días</span>
                        </div>
                    </div>`;
                lista.appendChild(card);
            });
        }
    } catch (error) { lista.innerHTML = '<p>Error al cargar préstamos.</p>'; }
}

// --- MODAL DE PRÉSTAMO ---
const modalPrestamo = document.getElementById('modalPrestamo');
window.abrirModalPrestamo = function(libro) {
    if(libro.Stock < 1) return alert("Libro agotado");
    modalPrestamo.classList.remove('hidden');
    document.getElementById('viewLoanForm').classList.remove('hidden');
    document.getElementById('viewLoanSuccess').classList.add('hidden');
    document.getElementById('viewLoanError').classList.add('hidden');

    document.getElementById('loanBookImage').src = libro.image || 'placeholder.jpg';
    document.getElementById('loanBookTitle').value = libro.title;
    document.getElementById('loanBookId').value = libro._id;

    const dev = new Date();
    dev.setDate(dev.getDate() + 15);
    document.getElementById('loanStartDate').value = new Date().toLocaleDateString('es-MX');
    document.getElementById('loanReturnDate').value = dev.toLocaleDateString('es-MX');
};

window.cerrarModalPrestamo = () => modalPrestamo.classList.add('hidden');

document.getElementById('btnConfirmarSolicitud')?.addEventListener('click', async () => {
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

// --- ADMIN DASHBOARD ---
async function cargarAdminDashboard() {
    const lista = document.getElementById('listaLibrosAdmin');
    const token = localStorage.getItem('token');
    if (!lista) return;
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

document.getElementById('btnVerAdmin')?.addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario')?.addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

// Perfil y Temas
window.abrirModalPerfil = function() {
    const email = localStorage.getItem('userEmail') || 'usuario@makia.com';
    document.getElementById('profileName').innerText = email.split('@')[0];
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