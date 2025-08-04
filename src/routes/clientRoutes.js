// src/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Rota para criar um novo cliente (POST /api/clients)
router.post('/clients', clientController.createClient);

// Rota para listar todos os clientes (GET /api/clients)
router.get('/clients', clientController.getAllClients);

// Rota para buscar um cliente por ID (GET /api/clients/123)
router.get('/clients/:id', clientController.getClientById);

// Rota para atualizar um cliente por ID (PUT /api/clients/123)
router.put('/clients/:id', clientController.updateClient);

// Rota para apagar um cliente por ID (DELETE /api/clients/123)
router.delete('/clients/:id', clientController.deleteClient);

module.exports = router;
