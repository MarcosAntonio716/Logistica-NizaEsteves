// src/routes/packageRoutes.js
const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

// Rota para criar uma nova embalagem (POST /api/packages)
router.post('/packages', packageController.createPackage);

// Rota para listar todas as embalagens (GET /api/packages)
router.get('/packages', packageController.getAllPackages);

// Rota para apagar uma embalagem por ID (DELETE /api/packages/123)
router.delete('/packages/:id', packageController.deletePackage);

module.exports = router;
