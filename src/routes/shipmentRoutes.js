// src/routes/shipmentRoutes.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/shipmentController');

// se quiser, esses logs ajudam a diagnosticar se veio algo errado
// console.log('controller keys:', Object.keys(controller));

const {
  createShipment,
  getAllShipments,
  updateShipmentStatus,
  deleteShipment,
} = controller;

router.post('/', createShipment);
router.get('/', getAllShipments);
router.patch('/:id/status', updateShipmentStatus);
router.delete('/:id', deleteShipment);

module.exports = router;
