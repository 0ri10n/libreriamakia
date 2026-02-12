// ELEMENTOS DEL DOM
const landingOptions = document.getElementById('landing-options');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- NAVEGACIÓN ENTRE VISTAS ---

//De Inicio a Login
document.getElementById('btnGoToLogin').addEventListener('click', () => {
    landingOptions.classList.add('hidden'); // Ocultar botones iniciales
    loginForm.classList.remove('hidden');   // Mostrar form login
});

//De Inicio a Registro
document.getElementById('btnGoToRegister').addEventListener('click', () => {
    landingOptions.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

//Volver (Cancelar Login)
document.getElementById('backFromLogin').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    landingOptions.classList.remove('hidden'); // Mostrar botones iniciales de nuevo
});

//Volver (Cancelar Registro)
document.getElementById('backFromRegister').addEventListener('click', () => {
    registerForm.classList.add('hidden');
    landingOptions.classList.remove('hidden');
});

// --- LÓGICA DE BACKEND (LOGIN) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            alert('Acceso concedido.');
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error de conexión');
    }
});

// --- LÓGICA DE BACKEND (REGISTRO) ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            alert('Cuenta creada con éxito.');
            // Volver al inicio o loguear directo
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error de conexión');
    }
});