// URL de API dinámica
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://libreriamakia-3p4u.onrender.com';

// ELEMENTOS DEL DOM
const landingOptions = document.getElementById('landing-options');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- NAVEGACIÓN ENTRE VISTAS (RESTURADA) ---
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

// LÓGICA DE REGISTRO
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

// --- FUNCIONES DEL CATÁLOGO ---

async function cargarCatalogo(busqueda = '', categoria = '') {
    const grid = document.getElementById('gridLibros');
    grid.innerHTML = '<p>Cargando libros...</p>';

    try {
        // Construimos la URL con los filtros que permite el backend
        let url = `https://libreriamakia.onrender.com/api/books?busqueda=${busqueda}`;
        if (categoria && categoria !== 'Todo') {
            url += `&categoria=${categoria}`;
        }

        const response = await fetch(url);
        const libros = await response.json();

        grid.innerHTML = ''; // Limpiar mensaje de carga

        libros.forEach((libro, index) => { // Agregamos 'index'
            const card = document.createElement('div');
            card.className = 'book-card';
            
            // Calculamos un retraso: el primero 0s, el segundo 0.1s, etc.
            card.style.animationDelay = `${index * 0.05}s`; 

            card.innerHTML = `
                <img src="${libro.image || 'placeholder.jpg'}" alt="${libro.title}">
                <h4>${libro.title}</h4>
                <p>${libro.author}</p>
                <span class="badge">${libro.ageRates}</span>
            `;
            card.onclick = () => abrirModalPrestamo(libro);
            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = '<p>Error al conectar con la biblioteca.</p>';
    }
}

// Evento para los botones de categoría
document.getElementById('containerCategorias').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        cargarCatalogo('', e.target.dataset.cat);
    }
});

document.getElementById('btnBuscar').addEventListener('click', () => {
    const term = document.getElementById('txtBusqueda').value;
    cargarCatalogo(term); // Usa la función de búsqueda del Integrante 3
});

// --- NAVEGACIÓN DASHBOARD ---

const btnInicio = document.getElementById('btnInicio');
const btnMisLibros = document.getElementById('btnMisLibros');
const secCatalogo = document.querySelector('.hero-section').parentElement; // Engloba banner y catalogo
const secPrestamos = document.getElementById('loans-section');

// Ir a Inicio
btnInicio.addEventListener('click', () => {
    btnInicio.classList.add('active');
    btnMisLibros.classList.remove('active');
    
    // Mostrar Inicio, Ocultar Préstamos
    document.querySelector('.hero-section').classList.remove('hidden');
    document.querySelector('.catalog-section').classList.remove('hidden');
    secPrestamos.classList.add('hidden');
});

// Ir a Mis Libros
btnMisLibros.addEventListener('click', () => {
    btnMisLibros.classList.add('active');
    btnInicio.classList.remove('active');
    
    // Ocultar Inicio, Mostrar Préstamos
    document.querySelector('.hero-section').classList.add('hidden');
    document.querySelector('.catalog-section').classList.add('hidden');
    secPrestamos.classList.remove('hidden');
    
    // ✅ AHORA SÍ LLAMAMOS A LA FUNCIÓN
    cargarMisPrestamos();
});



// --- CARGAR PRÉSTAMOS REALES ---
async function cargarMisPrestamos() {
    const lista = document.getElementById('listaPrestamos');
    lista.innerHTML = '<div class="loan-card"><p>Cargando tus préstamos...</p></div>';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            lista.innerHTML = '<div style="text-align:center; padding:40px;"><p style="color:#888;">⚠️ Debes iniciar sesión para ver tus préstamos.</p></div>';
            return;
        }
        
        // ENDPOINT CORRECTO (el que existe en tu backend)
        const response = await fetch('https://libreriamakia.onrender.com/api/loans', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al obtener préstamos');
        
        const prestamos = await response.json();
        lista.innerHTML = ''; // Limpiar mensaje de carga
        
        if (prestamos.length === 0) {
            // MENSAJE CUANDO NO HAY PRÉSTAMOS
            lista.innerHTML = `
                <div style="text-align:center; padding:40px;">
                    <p style="font-size:1.2rem; color:#888;">📚 No tienes libros en préstamo actualmente.</p>
                    <button onclick="document.getElementById('btnPedirPrestamo').click()" style="margin-top:20px; padding:10px 20px; background:#8a4f9e; color:white; border:none; border-radius:8px; cursor:pointer;">
                        Solicitar un libro
                    </button>
                </div>`;
        } else {
            // RENDERIZAR CADA PRÉSTAMO
            // ... (dentro del else) ...
            // RENDERIZAR CADA PRÉSTAMO CON ANIMACIÓN
            prestamos.forEach((prestamo, index) => { // Agregamos 'index'
                const libro = prestamo.book;
                
                // Calcular días restantes (Tu código original)
                const hoy = new Date();
                const fechaDevolucion = new Date(prestamo.returnDate);
                const diasRestantes = Math.ceil((fechaDevolucion - hoy) / (1000 * 60 * 60 * 24));
                
                const card = document.createElement('div');
                card.className = 'loan-card';
                
                // APLICAMOS EL RETRASO DE ANIMACIÓN AQUÍ TAMBIÉN
                card.style.animationDelay = `${index * 0.1}s`;

                card.innerHTML = `
                    <img src="${libro.image || 'https://via.placeholder.com/100x140?text=Sin+Portada'}" alt="${libro.title}">
                    <div class="loan-info">
                        <h3>${libro.title}</h3>
                        <p class="loan-desc">${libro.description || 'Sin descripción disponible.'}</p>
                        <div class="loan-meta">
                            <span>📅 Devolver: ${fechaDevolucion.toLocaleDateString('es-MX')}</span>
                            <span class="status-badge ${diasRestantes < 3 ? 'urgent' : ''}">${diasRestantes > 0 ? diasRestantes + ' días restantes' : '⚠️ Vencido'}</span>
                        </div>
                        <button onclick="devolverLibro('${prestamo._id}')" style="margin-top:15px; padding:8px 16px; background:#e0ccff; color:#4a0072; border:none; border-radius:6px; cursor:pointer; font-weight:600;">
                            Devolver libro
                        </button>
                    </div>
                `;
                lista.appendChild(card);
            });
        }
        
    } catch (error) {
        console.error(error);
        lista.innerHTML = '<div style="text-align:center; padding:40px;"><p style="color:#d9534f;">❌ Error al cargar tus préstamos.</p></div>';
    }
}




    // --- LÓGICA DEL MODAL DE PRÉSTAMO AVANZADO ---
    const modalPrestamo = document.getElementById('modalPrestamo');
    const viewForm = document.getElementById('viewLoanForm');
    const viewSuccess = document.getElementById('viewLoanSuccess');
    const viewError = document.getElementById('viewLoanError');

    // Abrir el modal preparado
    window.abrirModalPrestamo = function(libro) {
        if(libro.Stock < 1) return alert("Libro agotado");
        
        modalPrestamo.classList.remove('hidden');
        viewForm.classList.remove('hidden');
        viewSuccess.classList.add('hidden');
        viewError.classList.add('hidden');

        // Llenar datos visuales
        document.getElementById('loanBookImage').src = libro.image || 'placeholder.jpg';
        document.getElementById('loanBookTitle').value = libro.title;
        document.getElementById('loanBookId').value = libro._id;
        
        // Calcular fechas (Hoy + 15 días)
        const hoy = new Date();
        const dev = new Date();
        dev.setDate(hoy.getDate() + 15);
        
        document.getElementById('loanStartDate').value = hoy.toLocaleDateString('es-MX');
        document.getElementById('loanReturnDate').value = dev.toLocaleDateString('es-MX');
    };

    window.cerrarModalPrestamo = function() {
        modalPrestamo.classList.add('hidden');
    };

    // Confirmar Solicitud
    document.getElementById('btnConfirmarSolicitud').addEventListener('click', async () => {
        const bookId = document.getElementById('loanBookId').value;
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('https://libreriamakia.onrender.com/api/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bookId })
            });
            
            // Ocultar formulario
            viewForm.classList.add('hidden');

            if (res.ok) {
                // ÉXITO: Mostrar vista morada y llenar datos
                viewSuccess.classList.remove('hidden');
                document.getElementById('successBookImage').src = document.getElementById('loanBookImage').src;
                document.getElementById('successBookTitle').innerText = document.getElementById('loanBookTitle').value;
                document.getElementById('successReturnDate').innerText = document.getElementById('loanReturnDate').value;
                
                cargarMisPrestamos(); // Actualizar lista de atrás
                cargarCatalogo(); // Actualizar stock visual
            } else {
                // ERROR: Mostrar vista roja
                viewError.classList.remove('hidden');
                document.getElementById('errorBookImage').src = document.getElementById('loanBookImage').src;
                document.getElementById('errorBookTitle').innerText = document.getElementById('loanBookTitle').value;
            }
        } catch (e) { alert("Error de conexión"); }
    });

    // --- LÓGICA DE ADMINISTRADOR COMPLETA ---



    // --- FUNCIONES DE CARGA CON SELECCIÓN (CHECKBOX) ---

    async function cargarAdminDashboard() {
        const lista = document.getElementById('listaLibrosAdmin');
        lista.innerHTML = '<p style="text-align:center">Cargando...</p>';
        try {
            const res = await fetch('https://libreriamakia.onrender.com/api/books');
            const libros = await res.json();
            document.getElementById('statLibros').innerText = libros.length;
            lista.innerHTML = '';
            libros.forEach(libro => {
                const div = document.createElement('div');
                div.className = 'admin-list-item';
                const libroSafe = JSON.stringify(libro).replace(/"/g, '&quot;').replace(/'/g, "\\'");
                div.innerHTML = `
                    <input type="checkbox" class="select-item" data-id="${libro._id}" style="margin-right:15px; transform: scale(1.2);">
                    <img src="${libro.image || 'placeholder.jpg'}" class="admin-item-img">
                    <div class="admin-item-info">
                        <h3>${libro.title}</h3>
                        <p>Autor: ${libro.author}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-icon-square" onclick='abrirModalEditar(${libroSafe})'>
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    </div>`;
                lista.appendChild(div);
            });
        } catch (e) { console.error(e); }
    }

// --- LÓGICA DE BORRADO POR SELECCIÓN ---

window.confirmarBorradoMasivo = async function() {
    const seleccionados = Array.from(document.querySelectorAll('.select-item:checked')).map(cb => cb.dataset.id);
    if (seleccionados.length === 0) return alert("Selecciona al menos un libro.");
    if (!confirm(`¿Borrar ${seleccionados.length} libros seleccionados?`)) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch('https://libreriamakia.onrender.com/api/books/batch', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ids: seleccionados })
        });
        const data = await res.json();
        alert(data.msg || "Libros eliminados");
        cargarAdminDashboard();
    } catch (e) { alert("Error al borrar."); }
};

window.confirmarBorradoMasivoPrestamos = async function() {
    const seleccionados = Array.from(document.querySelectorAll('.select-item-loan:checked')).map(cb => cb.dataset.id);
    if (seleccionados.length === 0) return alert("Selecciona al menos un préstamo.");
    alert("Backend actual: No existe ruta masiva para préstamos. IDs seleccionados: " + seleccionados.join(', '));
};

window.confirmarBorradoMasivoUsuarios = () => alert("Backend actual: No existe ruta de borrado masivo de usuarios.");



// --- LÓGICA DE PESTAÑAS Y CARGA DE DATOS ---
document.querySelectorAll('.tab-link').forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. Gestión visual de tabs
        document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab'); 
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // 2. Cargar datos según la pestaña
        if (tabId === 'libros') cargarAdminDashboard(); // Recarga libros
        if (tabId === 'prestamos') cargarPrestamosAdmin();
        if (tabId === 'usuarios') cargarUsuariosAdmin();
    });
});

// FUNCIONES PARA MOSTRAR MODALES NUEVOS
window.mostrarFormAgregarPrestamo = function() {
    document.getElementById('modalAgregarPrestamo').classList.remove('hidden');
};

window.mostrarFormAgregarUsuario = function() {
    document.getElementById('modalAgregarUsuario').classList.remove('hidden');
};

// CARGAR LISTA DE PRÉSTAMOS (Admin)
async function cargarPrestamosAdmin() {
    const lista = document.getElementById('listaPrestamosAdmin');
    lista.innerHTML = '<p style="text-align:center">Cargando préstamos...</p>';
    const token = localStorage.getItem('token');

    try {
        // Intentamos llamar a la API (Nota: Tu server actual solo tiene GET /api/loans para usuario)
        const res = await fetch('https://libreriamakia.onrender.com/api/loans', {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("No se pudo cargar");
        const prestamos = await res.json();

        lista.innerHTML = '';
        if(prestamos.length === 0) {
            lista.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No hay préstamos registrados.</p>';
            return;
        }

        prestamos.forEach(p => {
            const libro = p.book || { title: "Libro desconocido", image: "" };
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <div style="width:50px; height:50px; background:#f0f0f0; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:20px; font-size:1.5rem;">📅</div>
                <div class="admin-item-info">
                    <h3>${libro.title}</h3>
                    <p>Fecha devolución: ${new Date(p.returnDate).toLocaleDateString()}</p>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon-square" style="background:#fee2e2; color:#991b1b;" onclick="alert('Función borrar préstamo pendiente')">🗑️</button>
                </div>
            `;
            lista.appendChild(div);
        });
    } catch (e) {
        lista.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">⚠️ No se pueden visualizar todos los préstamos con el backend actual.</p>';
    }
}

// CARGAR LISTA DE USUARIOS (Admin)
async function cargarUsuariosAdmin() {
    const lista = document.getElementById('listaUsuariosAdmin');
    lista.innerHTML = '<p style="text-align:center">Cargando usuarios...</p>';
    
    // Como NO existe la ruta /api/users en tu server.js, mostramos un mensaje elegante
    // simulando que intentó conectar.
    setTimeout(() => {
        lista.innerHTML = `
            <div style="text-align:center; padding:40px; color:#666;">
                <p>⚠️ <strong>Base de datos de Usuarios no accesible</strong></p>
                <p style="font-size:0.9rem;">El servidor actual no tiene habilitada la ruta para listar usuarios.</p>
            </div>
        `;
    }, 500);
}


// 3. Modal Editar/Agregar
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
    document.getElementById('modalAdminTitle').innerText = "Editar";
    
    document.getElementById('editTitle').value = libro.title;
    document.getElementById('editAuthor').value = libro.author;
    document.getElementById('editCategory').value = libro.category;
    document.getElementById('editStock').value = libro.Stock;
    document.getElementById('editImage').value = libro.image;
    document.getElementById('editDescription').value = libro.description || '';
    document.getElementById('editAgeRates').value = libro.ageRates || 'Todo Público';
    document.getElementById('editBookId').value = libro._id;
    
    document.getElementById('previewEdit').innerHTML = `<img src="${libro.image}" style="max-width:100%; height:100%; object-fit:cover;">`;
    modalEdit.classList.remove('hidden');
};

window.cerrarModalEditar = function() {
    modalEdit.classList.add('hidden');
};

// 4. Guardar Cambios (Submit)
document.getElementById('formEditarLibro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const datos = {
        title: document.getElementById('editTitle').value,
        author: document.getElementById('editAuthor').value,
        category: document.getElementById('editCategory').value,
        ageRates: document.getElementById('editAgeRates').value,
        Stock: parseInt(document.getElementById('editStock').value),
        image: document.getElementById('editImage').value,
        description: document.getElementById('editDescription').value
    };

    const url = editandoId 
        ? `https://libreriamakia.onrender.com/api/books/${editandoId}` 
        : 'https://libreriamakia.onrender.com/api/books';              
    
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datos)
        });

        if(res.ok) {
            alert(editandoId ? "Libro actualizado" : "Libro creado");
            cerrarModalEditar();
            cargarAdminDashboard();
            cargarCatalogo(); // Actualizar vista usuario también
        } else {
            alert("Error al guardar cambios");
        }
    } catch (e) { alert("Error de conexión"); }
});

// 5. Eliminar Libro
window.eliminarLibro = async function(id) {
    if(!confirm("¿Seguro que quieres borrar este libro?")) return;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`https://libreriamakia.onrender.com/api/books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            cargarAdminDashboard();
        } else {
            const data = await res.json();
            alert(data.msg || "No se puede eliminar (tal vez está prestado)");
        }
    } catch (e) { alert("Error de conexión"); }
};

// 6. Vista previa de imagen
document.getElementById('editImage').addEventListener('change', (e) => {
    const url = e.target.value;
    document.getElementById('previewEdit').innerHTML = url ? `<img src="${url}" style="max-width:100%; height:100%; object-fit:cover;">` : '';
});

// 7. BOTONES DE ACCIÓN GLOBAL

// A) Botón "Solicitar Préstamo" (En sección Mis Libros)
// Como el préstamo requiere elegir un libro, este botón te lleva al Catálogo.
document.getElementById('btnPedirPrestamo').addEventListener('click', () => {
    // Simula clic en el botón de Inicio para ir al catálogo
    document.getElementById('btnInicio').click();
    alert("Selecciona un libro del catálogo para solicitarlo.");
});

// B) Botón "Ver Admin" (Cambio de Vista)
const btnVerAdmin = document.getElementById('btnVerAdmin');
if (btnVerAdmin) {
    btnVerAdmin.addEventListener('click', () => {
        document.getElementById('user-dashboard').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        cargarAdminDashboard();
    });
}

// C) Salir del Admin con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        document.getElementById('admin-dashboard').classList.add('hidden');
        document.getElementById('user-dashboard').classList.remove('hidden');
    }
});

// D) Botón Regresar al Dashboard de Usuario (Desde Admin)
const btnVolverUsuario = document.getElementById('btnVolverUsuario');
if (btnVolverUsuario) {
    btnVolverUsuario.addEventListener('click', () => {
        document.getElementById('admin-dashboard').classList.add('hidden');
        document.getElementById('user-dashboard').classList.remove('hidden');
    });
}

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