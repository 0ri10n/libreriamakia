// --- LÓGICA DE INTERCAMBIO DE VISTAS ---
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

document.getElementById('showRegister').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

document.getElementById('showLogin').addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// --- LÓGICA DE LOGIN ---
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

// --- LÓGICA DE REGISTRO ---
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
            // Volver al login tras registrarse
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (error) {
        alert('Error de conexión');
    }
});