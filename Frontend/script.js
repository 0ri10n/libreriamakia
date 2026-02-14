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

// --- GESTIÓN DEL CATÁLOGO ---

async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    grid.innerHTML = '<p>Cargando libros...</p>';
    try {
        let url = `${API_URL}/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') url += `&categoria=${categoria}`;

        const res = await fetch(url);
        const libros = await res.json();
        grid.innerHTML = ''; 

        libros.forEach(l => {
            const div = document.createElement('div');
            div.className = 'book-card';
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

// --- GESTIÓN DE PRÉSTAMOS (NUEVO: Para que funcione el clic en el libro) ---

window.abrirModalPrestamo = function(libro) {
    if(libro.Stock < 1) return alert("Libro agotado temporalmente");
    document.getElementById('modalPrestamo').classList.remove('hidden');
    document.getElementById('loanBookTitle').value = libro.title;
    document.getElementById('loanBookId').value = libro._id;
    document.getElementById('loanBookImage').src = libro.image;
};

window.cerrarModalPrestamo = () => document.getElementById('modalPrestamo').classList.add('hidden');

document.getElementById('btnConfirmarSolicitud')?.addEventListener('click', async () => {
    const bookId = document.getElementById('loanBookId').value;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/loans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ bookId })
        });
        if(res.ok) {
            alert("Préstamo solicitado con éxito");
            cerrarModalPrestamo();
            cargarCatalogo();
        }
    } catch (e) { alert("Error al procesar préstamo"); }
});

// --- DASHBOARD ADMIN ---

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

        document.getElementById('statLibros').innerText = libros.length;
        document.getElementById('statPrestamos').innerText = prestamos.length;
        document.getElementById('statUsuarios').innerText = usuarios.length;

        lista.innerHTML = '';
        libros.forEach(libro => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            const libroSafe = JSON.stringify(libro).replace(/"/g, '&quot;');
            div.innerHTML = `
                <img src="${libro.image}" style="width:50px; height:70px; object-fit:cover; margin-right:15px;">
                <div class="admin-item-info">
                    <h3>${libro.title}</h3>
                    <p>${libro.author} | Stock: ${libro.Stock}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon-square" onclick='abrirModalEditar(${libroSafe})'>
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn-icon-square" style="color:red" onclick="eliminarLibro('${libro._id}')">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>`;
            lista.appendChild(div);
        });
    } catch (e) { console.error("Error dashboard:", e); }
}

// --- FUNCIONES DE ADMINISTRACIÓN (EDITAR/GUARDAR) ---

window.abrirModalEditar = function(libro) {
    document.getElementById('editBookId').value = libro._id || '';
    document.getElementById('editTitle').value = libro.title || '';
    document.getElementById('editAuthor').value = libro.author || '';
    document.getElementById('editStock').value = libro.Stock || 0;
    document.getElementById('editImage').value = libro.image || '';
    document.getElementById('modalEditarLibro').classList.remove('hidden');
};

window.cerrarModalEditar = () => document.getElementById('modalEditarLibro').classList.add('hidden');

// Evento para GUARDAR cambios del libro (NUEVO: Para que los botones guarden)
document.getElementById('formEditarLibro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editBookId').value;
    const token = localStorage.getItem('token');
    const datos = {
        title: document.getElementById('editTitle').value,
        author: document.getElementById('editAuthor').value,
        Stock: document.getElementById('editStock').value,
        image: document.getElementById('editImage').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/api/books/${id}` : `${API_URL}/api/books`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datos)
        });
        if(res.ok) {
            alert("Cambios guardados correctamente");
            cerrarModalEditar();
            cargarAdminDashboard();
        }
    } catch (e) { alert("Error al guardar datos"); }
});

window.eliminarLibro = async (id) => {
    if(!confirm("¿Eliminar este libro?")) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/api/books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        cargarAdminDashboard();
    } catch (e) { alert("Error al eliminar"); }
};

// --- CAMBIO DE VISTAS Y FILTROS ---

document.getElementById('btnVerAdmin').addEventListener('click', () => {
    document.getElementById('user-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    cargarAdminDashboard();
});

document.getElementById('btnVolverUsuario').addEventListener('click', () => {
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');
});

document.getElementById('btnBuscar').addEventListener('click', () => {
    const term = document.getElementById('txtBusqueda').value;
    cargarCatalogo(term);
});

document.getElementById('containerCategorias').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});