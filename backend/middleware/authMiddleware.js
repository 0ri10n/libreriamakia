const jwt = require('jsonwebtoken');

const protegerRuta = (req, res, next) => {
    // Obtener el token del encabezado de la petición
    const token = req.header('Authorization');

    // Si no hay token, denegar acceso
    
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    try {
        // Quitar el prefijo "Bearer " si existe
        const cifrado = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = cifrado.user; // Añadimos el ID del usuario a la petición
        next(); // Continuar a la siguiente función
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};

module.exports = protegerRuta; 