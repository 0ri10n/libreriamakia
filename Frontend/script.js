// Al cargar la página, verificar si ya existe un token
window.onload = () => {
    const token = localStorage.getItem('token');
    if (token) {
        alert('Ya tienes una sesión activa.');
        // window.location.href = 'dashboard.html'; // Redirigir si ya está logueado
    }
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
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
            // Guardamos el JWT de forma segura en el navegador
            localStorage.setItem('token', data.token);
            alert('Acceso concedido. Bienvenido al sistema.');

            // Redirección opcional a la página principal de la biblioteca
            // window.location.href = 'dashboard.html';
        } else {
            alert('Error de seguridad: ' + (data.msg || 'Acceso denegado'));
        }
    } catch (error) {
        console.error('Error en la comunicación con el Backend:', error);
        alert('No se pudo establecer conexión con el servidor de autenticación.');
    }
});