// src/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Rota para buscar as configurações (GET)
router.get('/settings', settingsController.getSettings);

// Rota para salvar ou atualizar as configurações (POST)
router.post('/settings', settingsController.saveSettings);

module.exports = router;
