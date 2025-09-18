// src/models/Shipment.js
const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    nomeCliente: {
      type: String,
      required: true,
      trim: true,
    },
    transportadora: {
      type: String,
      required: true,
      trim: true,
    },
    codigoRastreio: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['aguardando_pagamento', 'pago', 'aguardando_envio', 'enviado', 'erro'],
      default: 'aguardando_pagamento',
      index: true,
    },
    preco: {
      type: Number,
      required: true,
      min: 0,
    },
    criadoEm: {
      type: Date,
      default: Date.now,
      index: true,
    },
    atualizadoEm: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// atualiza timestamp em save
shipmentSchema.pre('save', function (next) {
  this.atualizadoEm = new Date();
  next();
});

// atualiza timestamp em findOneAndUpdate / findByIdAndUpdate
shipmentSchema.pre(['findOneAndUpdate', 'findByIdAndUpdate'], function (next) {
  this.set({ atualizadoEm: new Date() });
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);
