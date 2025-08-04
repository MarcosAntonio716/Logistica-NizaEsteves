// src/routes/freightRoutes.js

const express = require('express');
const router = express.Router(); // Usamos o Router do Express para criar rotas separadas.

// Importamos nosso controller para poder usá-lo.
// O '..' significa "voltar uma pasta", para sairmos de 'routes' e entrarmos em 'controllers'.
const freightController = require('../controllers/freightController');

// Aqui definimos a rota final: /cotacao
// Quando alguém acessar esta rota com um método POST, a função 'calculateFreight' será executada.
router.post('/cotacao', freightController.calculateFreight);

// Exportamos o router com a rota configurada.
module.exports = router;