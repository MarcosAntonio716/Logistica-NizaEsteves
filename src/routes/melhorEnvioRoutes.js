const express = require('express');
const router = express.Router();
const {
  createMelhorEnvioLabel,
  previewMelhorEnvioLabel,
  payMelhorEnvioLabel,
  printMelhorEnvioLabel,
} = require('../controllers/melhorEnvioController');

// Criar etiqueta
router.post('/labels', createMelhorEnvioLabel);

// Pré-visualizar etiqueta
router.get('/labels/:id/preview', previewMelhorEnvioLabel);

// Pagar etiqueta
router.post('/labels/:id/pay', payMelhorEnvioLabel);

// Imprimir etiqueta definitiva
router.get('/labels/:id/print', printMelhorEnvioLabel);

module.exports = router;
