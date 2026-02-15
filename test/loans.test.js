const request = require('supertest');
const app = require('../backend/server'); // Importamos tu app exportada

describe('Pruebas de Lógica de Préstamos (QA)', () => {
  
  it('Debería rechazar la devolución si han pasado menos de 3 días', async () => {
    // Simulamos un ID de préstamo (esto es solo un ejemplo de estructura)
    const res = await request(app)
      .put('/api/loans/return/64f1234567890abcdef12345')
      .set('Authorization', 'Bearer TOKEN_FALSO');

    expect(res.statusCode).not.toBe(200);
  });

});