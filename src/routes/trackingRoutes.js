// src/routes/trackingRoutes.js
const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Rota para rastrear um pacote (GET /api/tracking/CODIGO123)
router.get('/tracking/:code', trackingController.trackPackage);

module.exports = router;
