const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : '';

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
            localStorage.setItem('userRole', data.role);
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
            localStorage.setItem('userRole', data.role);
            entrarAlSistema();
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error al registrar usuario');
    }
});

function entrarAlSistema() {
    const role = localStorage.getItem('userRole');
    const btnAdmin = document.getElementById('btnVerAdmin');

    document.querySelector('.stars-background').classList.add('hidden');
    document.querySelector('.main-container').classList.add('hidden');
    document.getElementById('user-dashboard').classList.remove('hidden');

    
    if (role === 'admin') {
        btnAdmin.classList.remove('hidden'); 
    } else {
        btnAdmin.classList.add('hidden');    
    }

    cargarCatalogo();
}

window.cerrarSesion = () => {
    localStorage.clear(); 
    location.reload(); 
};

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

async function cargarAdminDashboard() {
    const lista = document.getElementById('listaLibrosAdmin');
    const token = localStorage.getItem('token');
    
    // Elementos visuales (Contadores)
    const statLibros = document.getElementById('statLibros');
    const statPrestamos = document.getElementById('statPrestamos');
    const statUsuarios = document.getElementById('statUsuarios');

    if (!lista) return;
    lista.innerHTML = '<p style="text-align:center">Cargando panel...</p>';

    // VERIFICACIÓN DE SEGURIDAD
    if (!token) {
        alert("Sesión expirada");
        return cerrarSesion();
    }

    console.log("Conectando a:", API_URL);

    fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }})
        .then(res => res.json())
        .then(users => { 
            if(statUsuarios) statUsuarios.innerText = users.length || 0; 
        })
        .catch(e => console.error("Error usuarios:", e));

    fetch(`${API_URL}/api/loans/all`, { headers: { 'Authorization': `Bearer ${token}` }})
                .then(res => {
                    if(!res.ok) throw new Error(`Error ${res.status}: No se pudieron cargar préstamos`);
                    return res.json();
                })
                .then(loansRaw => { 
                    // APLICAMOS LA MISMA SOLUCIÓN: Filtrar los que no tienen libro
                    const loans = loansRaw.filter(p => p.book !== null);
                    
                    console.log("Préstamos activos:", loans.length);
                    if(statPrestamos) statPrestamos.innerText = loans.length || 0; 
                })
                .catch(e => {
                    console.error("Fallo en préstamos:", e);
                    if(statPrestamos) statPrestamos.innerText = "0";
                });

    try {
        const res = await fetch(`${API_URL}/api/books`);
        const libros = await res.json();

        if(statLibros) statLibros.innerText = libros.length || 0;
        lista.innerHTML = '';

        if (libros.length === 0) {
            lista.innerHTML = '<p style="text-align:center">No hay libros registrados.</p>';
            return;
        }

        libros.forEach(libro => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            const libroSafe = JSON.stringify(libro).replace(/"/g, '&quot;').replace(/'/g, "\\'");
            
            div.innerHTML = `
                <input type="checkbox" class="select-item" data-id="${libro._id}" style="margin-right:15px; transform: scale(1.2);">
                <img src="${libro.image || 'placeholder.jpg'}" class="admin-item-img" style="width:50px; height:70px; object-fit:cover; margin-right:15px; border-radius:4px;">
                <div class="admin-item-info">
                    <h3>${libro.title}</h3>
                    <p>${libro.author}</p>
                    <p style="font-size:0.85rem; color:#666;">Stock: <strong>${libro.Stock}</strong></p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon-square" onclick='abrirModalEditar(${libroSafe})'>
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                </div>`;
            lista.appendChild(div);
        });

    } catch (e) {
        console.error("Error libros:", e);
        lista.innerHTML = '<p style="text-align:center; color:red">Error de conexión.</p>';
    }
}

window.abrirModalEditar = function(libro) {
    const modal = document.getElementById('modalEditarLibro');
    document.getElementById('editBookId').value = libro._id;
    document.getElementById('editTitle').value = libro.title;
    document.getElementById('editAuthor').value = libro.author;
    document.getElementById('editStock').value = libro.Stock;
    document.getElementById('editImage').value = libro.image;
    modal.classList.remove('hidden');
};

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

// Buscador
document.getElementById('btnBuscar').addEventListener('click', () => {
    const term = document.getElementById('txtBusqueda').value;
    cargarCatalogo(term);
});

// Categorías
document.getElementById('containerCategorias').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});

// --- NAVEGACIÓN DASHBOARD (INICIO / MIS LIBROS) ---
const btnInicio = document.getElementById('btnInicio');
const btnMisLibros = document.getElementById('btnMisLibros');
const secPrestamos = document.getElementById('loans-section');

if (btnInicio && btnMisLibros) {
    btnInicio.addEventListener('click', () => {
        btnInicio.classList.add('active');
        btnMisLibros.classList.remove('active');
        document.querySelector('.hero-section').classList.remove('hidden');
        document.querySelector('.catalog-section').classList.remove('hidden');
        if(secPrestamos) secPrestamos.classList.add('hidden');
    });

    btnMisLibros.addEventListener('click', () => {
        btnMisLibros.classList.add('active');
        btnInicio.classList.remove('active');
        document.querySelector('.hero-section').classList.add('hidden');
        document.querySelector('.catalog-section').classList.add('hidden');
        if(secPrestamos) secPrestamos.classList.remove('hidden');
        cargarMisPrestamos();
    });
}

// Función para cargar los préstamos del usuario
async function cargarMisPrestamos() {
    const lista = document.getElementById('listaPrestamos');
    const token = localStorage.getItem('token');
    
    if (!lista) return;
    lista.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Cargando tus préstamos...</p>';

    try {
        const res = await fetch(`${API_URL}/api/loans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar');
        
        const prestamosRaw = await res.json();
        
        // FILTRO CRÍTICO: Eliminar préstamos donde el libro ya no existe (es null)
        const prestamos = prestamosRaw.filter(p => p.book !== null);

        lista.innerHTML = '';

        if (prestamos.length === 0) {
            lista.innerHTML = '<div style="text-align:center; padding:40px;"><p style="color:#888;">No tienes préstamos activos.</p></div>';
            return;
        }

        prestamos.forEach(p => {
            const libro = p.book; // Ya sabemos que no es null por el filtro
            const fechaFormateada = new Date(p.returnDate).toLocaleDateString();

            const accionHTML = p.status === 'active' 
                ? `<button class="btn-return" onclick="devolverLibro('${p._id}')">Devolver ahora</button>` 
                : `<p style="color: #2e7d32; font-weight: bold; margin-top:10px;"> Libro entregado</p>`;

            const multaTexto = p.fine > 0 
                ? `<p style="color: #d32f2f; font-weight: bold; margin-top:5px;"> Multa acumulada: $${p.fine}</p>` 
                : '';

            const card = document.createElement('div');
            card.className = 'loan-card';

            card.innerHTML = `
                <img src="${libro.image || 'placeholder.jpg'}" alt="${libro.title}">
                <div class="loan-info">
                    <h3>${libro.title}</h3>
                    <p class="loan-desc">${libro.description || 'Sin descripción'}</p>
                    <div class="loan-meta">
                        <span style="display: flex; align-items: center; gap: 5px; color: #555;">
                             <span class="material-symbols-outlined" style="font-size: 18px;">calendar_month</span>
                             Límite: ${fechaFormateada}
                        </span>
                        <span class="status-badge ${p.status === 'active' ? 'urgent' : ''}">
                            ${p.status === 'active' ? 'En Curso' : 'Finalizado'}
                        </span>
                    </div>
                    ${multaTexto}
                    ${accionHTML} </div>`;
            lista.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        lista.innerHTML = '<p style="text-align:center; color:red;">Error de conexión al cargar préstamos.</p>';
    }
}

// --- LÓGICA PARA DEVOLVER LIBRO  ---
window.devolverLibro = async (loanId) => {
    if (!confirm("¿Deseas devolver este libro a la biblioteca?")) return;

    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/api/loans/return/${loanId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });


        const text = await res.text();
        let data;
        
        try {
            data = JSON.parse(text); 
        } catch (e) {

            console.error("Respuesta no válida del servidor:", text);
            throw new Error(`Error del servidor (${res.status}): No se recibió una respuesta válida.`);
        }

        if (res.ok) {

            alert("✅ " + (data.message || data.mensaje || "Libro devuelto exitosamente"));
            cargarMisPrestamos(); 
            if (typeof cargarCatalogo === 'function') cargarCatalogo(); 

        } else {

            alert("⚠️ AVISO DE BIBLIOTECA:\n" + (data.message || data.msg));
        }

    } catch (error) {

        alert(error.message || "Error de conexión al intentar devolver.");
    }
};

window.mostrarFormAgregarLibro = function() {
    document.getElementById('formEditarLibro').reset();
    document.getElementById('editBookId').value = ''; 
    document.getElementById('modalAdminTitle').innerText = "Agregar Libro";
    document.getElementById('previewEdit').innerHTML = '';
    document.getElementById('modalEditarLibro').classList.remove('hidden');
};

window.cerrarModalEditar = function() {
    document.getElementById('modalEditarLibro').classList.add('hidden');
};

document.getElementById('formEditarLibro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const id = document.getElementById('editBookId').value;
    
    const datos = {
        title: document.getElementById('editTitle').value,
        author: document.getElementById('editAuthor').value,
        category: document.getElementById('editCategory').value,
        ageRates: document.getElementById('editAgeRates').value,
        Stock: parseInt(document.getElementById('editStock').value),
        image: document.getElementById('editImage').value,
        description: document.getElementById('editDescription').value
    };


    const url = id ? `${API_URL}/api/books/${id}` : `${API_URL}/api/books`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert(id ? "Libro actualizado" : "Libro creado");
            window.cerrarModalEditar();
            cargarAdminDashboard(); // Refrescar la tabla
            cargarCatalogo(); // Refrescar el catálogo del usuario
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || err.msg));
        }
    } catch (e) { alert("Error de conexión al guardar."); }
});

window.confirmarBorradoMasivo = async function() {
    const checkboxes = document.querySelectorAll('.select-item:checked');
    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    
    if (ids.length === 0) return alert("Selecciona al menos un libro para borrar.");
    if (!confirm(`¿Estás seguro de borrar ${ids.length} libros? Esta acción es irreversible.`)) return;

    const token = localStorage.getItem('token');
    let errores = 0;

    for (const id of ids) {
        try {
            await fetch(`${API_URL}/api/books/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            errores++;
        }
    }

    if (errores > 0) {
        alert(`Operación terminada con ${errores} errores.`);
    } else {
        alert("Libros eliminados correctamente.");
    }
    cargarAdminDashboard(); // Refrescar la lista
};

window.mostrarFormAgregarPrestamo = () => document.getElementById('modalAgregarPrestamo').classList.remove('hidden');
window.mostrarFormAgregarUsuario = () => document.getElementById('modalAgregarUsuario').classList.remove('hidden');

window.confirmarBorradoMasivoPrestamos = async () => {
    const checkboxes = document.querySelectorAll('.select-prestamo:checked');
    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    
    if (ids.length === 0) return alert("Selecciona al menos un préstamo para borrar.");
    if (!confirm(`¿Eliminar ${ids.length} préstamos?`)) return;

    const token = localStorage.getItem('token');
    
    for (const id of ids) {
        try {
            await fetch(`${API_URL}/api/loans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) { console.error(e); }
    }
    cargarTablaPrestamos(); // Refrescar lista
};

window.confirmarBorradoMasivoUsuarios = async () => {
    const checkboxes = document.querySelectorAll('.select-usuario:checked');
    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    
    if (ids.length === 0) return alert("Selecciona al menos un usuario para borrar.");
    if (!confirm(`¿Eliminar ${ids.length} usuarios? Esta acción no se puede deshacer.`)) return;

    const token = localStorage.getItem('token');

    for (const id of ids) {
        try {
            await fetch(`${API_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) { console.error(e); }
    }
    cargarTablaUsuarios(); // Refrescar lista
};
// --- PERFIL DE USUARIO Y TEMAS ---

window.abrirModalPerfil = function() {
    const email = localStorage.getItem('userEmail') || 'Usuario';
    const nombre = email.split('@')[0];
    
    document.getElementById('profileName').innerText = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    document.getElementById('profileEmail').innerText = email;
    document.getElementById('modalPerfilUsuario').classList.remove('hidden');
};

window.cambiarTema = function(primary, secondary) {
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    
    localStorage.setItem('themePrimary', primary);
    localStorage.setItem('themeSecondary', secondary);
};

// Aplicar tema guardado al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const p = localStorage.getItem('themePrimary');
    const s = localStorage.getItem('themeSecondary');
    if (p && s) window.cambiarTema(p, s);
});


// ==========================================
// --- LÓGICA DE PRÉSTAMOS (FALTANTE) ---
// ==========================================

const btnPedir = document.getElementById('btnPedirPrestamo');
if (btnPedir) {
    btnPedir.addEventListener('click', () => {
        document.getElementById('btnInicio').click();
        alert("Por favor, selecciona un libro del catálogo para solicitarlo.");
    });
}

const modalPrestamo = document.getElementById('modalPrestamo');
const viewForm = document.getElementById('viewLoanForm');
const viewSuccess = document.getElementById('viewLoanSuccess');
const viewError = document.getElementById('viewLoanError');

window.abrirModalPrestamo = function(libro) {
    // Validar Stock antes de abrir
    if (libro.Stock !== undefined && libro.Stock < 1) {
        return alert("Lo sentimos, este libro está agotado.");
    }
    
    modalPrestamo.classList.remove('hidden');
    viewForm.classList.remove('hidden');
    viewSuccess.classList.add('hidden');
    viewError.classList.add('hidden');

    document.getElementById('loanBookImage').src = libro.image || 'placeholder.jpg';
    document.getElementById('loanBookTitle').value = libro.title;
    document.getElementById('loanBookId').value = libro._id;
    
    // Calcular fecha de devolución (Hoy + 15 días)
    const hoy = new Date();
    const dev = new Date();
    dev.setDate(hoy.getDate() + 15);
    document.getElementById('loanReturnDate').value = dev.toLocaleDateString('es-MX');
};

window.cerrarModalPrestamo = function() {
    modalPrestamo.classList.add('hidden');
};

document.getElementById('btnConfirmarSolicitud').addEventListener('click', async () => {
    const bookId = document.getElementById('loanBookId').value;
    const token = localStorage.getItem('token');

    if (!token) return alert("Tu sesión expiró. Por favor inicia sesión de nuevo.");

    try {
        // Usamos API_URL como indicaste
        const res = await fetch(`${API_URL}/api/loans`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ bookId })
        });
        
        // Ocultar formulario para mostrar resultado
        viewForm.classList.add('hidden');

        if (res.ok) {
            // ÉXITO: Mostrar pantalla morada
            viewSuccess.classList.remove('hidden');
            // Recargar datos de fondo para que se actualice el stock y la lista
            cargarCatalogo(); 
            cargarMisPrestamos(); 
        } else {
            // ERROR: Mostrar pantalla de error
            const data = await res.json();
            console.error("Error préstamo:", data);
            viewError.classList.remove('hidden');
        }
    } catch (e) { 
        alert("Error de conexión con el servidor."); 
    }
});


document.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Cargar datos según la pestaña seleccionada
        if (tabId === 'libros') cargarAdminDashboard(); // Ya existente
        if (tabId === 'prestamos') cargarTablaPrestamos();
        if (tabId === 'usuarios') cargarTablaUsuarios();
    });
});

async function cargarTablaUsuarios() {
    const contenedor = document.getElementById('listaUsuariosAdmin');
    const token = localStorage.getItem('token');
    
    contenedor.innerHTML = '<p style="text-align:center; padding:20px;">Cargando usuarios...</p>';

    try {
        const res = await fetch(`${API_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Error al cargar usuarios');
        const usuarios = await res.json();

        document.getElementById('statUsuarios').innerText = usuarios.length || 0;

        contenedor.innerHTML = '';
        if (usuarios.length === 0) {
            contenedor.innerHTML = '<p style="text-align:center;">No hay usuarios registrados.</p>';
            return;
        }

        usuarios.forEach(u => {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <input type="checkbox" class="select-usuario" data-id="${u._id}" style="margin-right:15px; transform: scale(1.2);">
                <div style="width:50px; height:50px; background:#e0ccff; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-right:15px; color:#4a0072; font-weight:bold; font-size:1.2rem;">
                    ${u.name.charAt(0).toUpperCase()}
                </div>
                <div class="admin-item-info">
                    <h3>${u.name}</h3>
                    <p>${u.email}</p>
                    <p style="font-size:0.8rem; color:#888;">ID: ${u._id}</p>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<p style="text-align:center; color:red;">Error de conexión.</p>';
    }
}

async function cargarTablaPrestamos() {
    const contenedor = document.getElementById('listaPrestamosAdmin');
    const token = localStorage.getItem('token');
    
    contenedor.innerHTML = '<p style="text-align:center; padding:20px;">Cargando préstamos...</p>';

    try {
        const res = await fetch(`${API_URL}/api/loans/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al cargar préstamos');
        const prestamosRaw = await res.json();

        // --- FILTRO MÁGICO: Si el libro es null (fue borrado), NO lo mostramos ---
        const prestamos = prestamosRaw.filter(p => p.book !== null);

        // Actualizamos el contador con el número REAL (sin contar los borrados)
        const contador = document.getElementById('statPrestamos');
        if(contador) contador.innerText = prestamos.length || 0;

        contenedor.innerHTML = '';
        if (prestamos.length === 0) {
            contenedor.innerHTML = '<p style="text-align:center;">No hay préstamos activos.</p>';
            return;
        }

        prestamos.forEach(p => {
            // Como ya filtramos, p.book SIEMPRE existe. Es seguro usarlo.
            const libro = p.book; 
            
            // Verificamos si el usuario existe o si fue borrado
            let usuarioInfo = 'Usuario desconocido';
            if (p.user) {
                // Si p.user es un objeto con nombre, úsalo. Si es solo ID, úsalo.
                usuarioInfo = p.user.name ? p.user.name : `ID: ${p.user}`;
            }
            
            const fecha = new Date(p.returnDate).toLocaleDateString();

            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <input type="checkbox" class="select-prestamo" data-id="${p._id}" style="margin-right:15px; transform: scale(1.2);">
                <div style="width:50px; height:50px; background:#f0fdf4; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:15px; color:#166534;">
                    <span class="material-symbols-outlined" style="font-size: 28px;">calendar_month</span>
                </div>
                <div class="admin-item-info">
                    <h3>${libro.title}</h3>
                    <p>Usuario: ${usuarioInfo}</p>
                    <p style="font-size:0.8rem; color:#666;">Devolución: ${fecha} | ID: ${p._id.slice(-6)}</p>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        contenedor.innerHTML = '<p style="text-align:center; color:red;">Error de conexión.</p>';
    }
}

const btnGuardarUsuario = document.querySelector('#modalAgregarUsuario .btn-save-header');

if (btnGuardarUsuario) {
    btnGuardarUsuario.onclick = async function() {
        const inputs = document.querySelectorAll('#modalAgregarUsuario input');
        const name = inputs[0].value;
        const email = inputs[1].value;
        const password = inputs[2].value;

        if (!name || !email || !password) return alert("Todos los campos son obligatorios");

        try {
            // Usamos la ruta /register que YA EXISTE en tu server.js
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Usuario creado correctamente");
                document.getElementById('modalAgregarUsuario').classList.add('hidden');
                
                // Limpiar campos
                inputs.forEach(i => i.value = '');
                
                // Recargar tabla si la función existe
                if (typeof cargarTablaUsuarios === 'function') cargarTablaUsuarios();
                if (typeof cargarAdminDashboard === 'function') cargarAdminDashboard();
            } else {
                alert("Error: " + data.msg);
            }
        } catch (e) { alert("Error de conexión"); }
    };
}

const btnGuardarPrestamo = document.querySelector('#modalAgregarPrestamo .btn-save-header');

if (btnGuardarPrestamo) {
    btnGuardarPrestamo.onclick = async function() {
        const inputs = document.querySelectorAll('#modalAgregarPrestamo input');
        const userId = inputs[0].value;
        const bookId = inputs[1].value;
        const token = localStorage.getItem('token');

        if (!userId || !bookId) return alert("Se requieren ambos IDs (Usuario y Libro)");

        try {
            // Usamos la ruta /api/loans que YA EXISTE en tu server.js
            // NOTA: Tu backend espera que el usuario venga del token (req.user.id),
            // pero para admin lo ideal es pasar el ID manual.
            // Si el backend es estricto, esto creará el préstamo a nombre del ADMIN (tú).
            // Si el backend fue actualizado para aceptar 'userId' en el body, usará ese.
            
            const res = await fetch(`${API_URL}/api/loans`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bookId, userId }) 
            });

            if (res.ok) {
                alert("Préstamo creado con éxito");
                document.getElementById('modalAgregarPrestamo').classList.add('hidden');
                inputs.forEach(i => i.value = '');
                if (typeof cargarTablaPrestamos === 'function') cargarTablaPrestamos();
                if (typeof cargarAdminDashboard === 'function') cargarAdminDashboard();
            } else {
                const data = await res.json();
                alert("Error: " + (data.msg || "No se pudo crear"));
            }
        } catch (e) { alert("Error de conexión"); }
    };
}

// =========================================================
// --- LÓGICA DE CONTADOR DE CARACTERES (DESCRIPCIÓN) ---
// =========================================================

const txtDescripcion = document.getElementById('editDescription');
const divContador = document.getElementById('contadorCaracteres');

// Función que actualiza el contador en tiempo real
function actualizarContador() {
    if (!txtDescripcion || !divContador) return;

    const textoOriginal = txtDescripcion.value;
    // Eliminamos todos los espacios en blanco para contar
    const textoSinEspacios = textoOriginal.replace(/\s/g, ''); 
    const cantidad = textoSinEspacios.length;

    divContador.innerText = `${cantidad} / 100`;

    if (cantidad > 100) {
        divContador.style.color = 'red';
        divContador.style.fontWeight = 'bold';
    } else {
        divContador.style.color = '#666';
        divContador.style.fontWeight = 'normal';
    }
}

if (txtDescripcion) {
    txtDescripcion.addEventListener('input', actualizarContador);
}

const funcionOriginalEditar = window.abrirModalEditar;
window.abrirModalEditar = function(libro) {
    funcionOriginalEditar(libro);
    actualizarContador();
};

const funcionOriginalAgregar = window.mostrarFormAgregarLibro;
window.mostrarFormAgregarLibro = function() {
    funcionOriginalAgregar();
    actualizarContador();
};

// --- VALIDACIÓN AL GUARDAR (IMPIDE ENVIAR SI SE PASA) ---

const formEdicion = document.getElementById('formEditarLibro');
if (formEdicion) {
    formEdicion.addEventListener('submit', (e) => {
        const texto = document.getElementById('editDescription').value;
        const sinEspacios = texto.replace(/\s/g, '').length;

        if (sinEspacios > 100) {
            e.preventDefault(); // DETIENE EL ENVÍO
            e.stopImmediatePropagation(); // DETIENE OTROS SCRIPTS
            alert(`La descripción es muy larga (${sinEspacios} caracteres sin espacios). El máximo es 100.`);
            return false;
        }
    }, true);
}

const inputBusquedaAdmin = document.getElementById('txtBusquedaAdmin');

if (inputBusquedaAdmin) {
    inputBusquedaAdmin.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.admin-list-item');

        items.forEach(item => {
            // El texto principal siempre está en el H3
            const textoPrincipal = item.querySelector('h3').innerText.toLowerCase();
            const textoSecundario = item.querySelector('.admin-item-info').innerText.toLowerCase();
            
            if (textoPrincipal.includes(termino) || textoSecundario.includes(termino)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}