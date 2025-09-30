// src/controllers/shipmentController.js
const Shipment = require('../models/Shipment');

/**
 * Cria uma ou várias etiquetas.
 * Aceita:
 *  - Objeto único: { nomeCliente, transportadora, codigoRastreio, preco, status? }
 *  - Array de objetos: [{ ... }, { ... }]
 */
const createShipment = async (req, res) => {
  try {
    const payload = req.body;

    const normalizar = (item) => {
      const { nomeCliente, transportadora, codigoRastreio, preco, status, origem } = item || {};
      if (!nomeCliente || !transportadora || !codigoRastreio || preco == null) {
        throw new Error('Dados incompletos. Campos obrigatórios: nomeCliente, transportadora, codigoRastreio, preco.');
      }
      if (!origem) {
        throw new Error('Campo "origem" é obrigatório (ex: "Correios API" ou "Melhor Envio").');
      }
      return {
        nomeCliente: String(nomeCliente).trim(),
        transportadora: String(transportadora).trim(),
        codigoRastreio: String(codigoRastreio).trim().toUpperCase(),
        preco: Number(preco),
        status: status || 'aguardando_pagamento',
        origem: String(origem).trim(),   // 👈 adicionando a origem
      };
    };

    if (Array.isArray(payload)) {
      const docs = payload.map(normalizar);
      const criadas = await Shipment.insertMany(docs, { ordered: false });
      return res.status(201).json(criadas);
    }

    const doc = normalizar(payload);
    const nova = await Shipment.create(doc);
    return res.status(201).json(nova);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Código de rastreio já existe.', campo: 'codigoRastreio' });
    }
    if (error.message?.startsWith('Dados incompletos') || error.message?.includes('origem')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Erro ao criar envio:', error);
    return res.status(500).json({ message: 'Erro ao criar envio.' });
  }
};

/**
 * Lista etiquetas com filtros e paginação.
 */
const getAllShipments = async (req, res) => {
  try {
    const { status, q } = req.query;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    if (q) {
      const regex = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ nomeCliente: regex }, { codigoRastreio: regex }];
    }

    const [items, total] = await Promise.all([
      Shipment.find(filter).sort({ criadoEm: -1 }).skip(skip).limit(limit).lean(),
      Shipment.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao buscar etiquetas:', error);
    res.status(500).json({ message: 'Erro ao buscar etiquetas.' });
  }
};

/**
 * Atualiza apenas o status da etiqueta.
 */
const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['aguardando_pagamento', 'pago', 'aguardando_envio', 'enviado', 'erro'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Status inválido.' });
    }

    const updated = await Shipment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Etiqueta não encontrada.' });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro ao atualizar status.' });
  }
};

const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Shipment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Etiqueta não encontrada.' });
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir etiqueta:', error);
    return res.status(500).json({ message: 'Erro ao excluir etiqueta.' });
  }
};

// 🔴 IMPORTANTE: exportar exatamente assim, uma única vez
module.exports = {
  createShipment,
  getAllShipments,
  updateShipmentStatus,
  deleteShipment,
};
