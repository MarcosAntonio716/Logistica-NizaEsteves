// src/controllers/melhorEnvioController.js
const axios = require("axios");
const Shipment = require("../models/Shipment");

// Base URL (permite alternar para sandbox via .env)
const ME_BASE_URL =
    process.env.MELHOR_ENVIO_BASE_URL?.trim() ||
    "https://www.melhorenvio.com.br";

// Cabeçalhos padrão para a API do Melhor Envio
const meHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
    // É recomendado ter um User-Agent identificável
    "User-Agent": process.env.MELHOR_ENVIO_USER_AGENT || "Niza Logistica/1.0",
});

// Utilitário: normaliza a(s) etiqueta(s) retornada(s) pelo checkout
function normalizeCheckoutResponse(data) {
    // O retorno pode variar conforme ambiente/versão.
    // A ideia aqui é obter sempre uma lista de objetos-etiketa com { id, service, price, ... }
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.shipments)) return data.shipments;
    if (Array.isArray(data?.orders)) return data.orders; // fallback

    if (data?.shipment) return [data.shipment];
    if (data?.order) return [data.order];

    // Último fallback: devolver o próprio objeto como array
    return [data];
}

// --- Criar etiqueta (CHECKOUT) ---
// Aceita body:
// 1) { shipments: [ { service, from, to, package, options? } ] }
// 2) { service, from, to, package, options? }  (montamos shipments automaticamente)
// --- Criar etiqueta (pedido no Melhor Envio) ---
// --- Criar etiqueta (CHECKOUT) ---
const createMelhorEnvioLabel = async (req, res) => {
    try {
        const payload = req.body;

        const response = await axios.post(
            "https://www.melhorenvio.com.br/api/v2/me/shipment/checkout",
            { shipments: [payload] }, // 🔴 precisa estar dentro de "shipments"
            { headers: meHeaders() }
        );

        const etiqueta = response.data[0]; // Melhor Envio retorna array

        // Salvar no MongoDB
        const etiqueta = response.data[0];

        const nova = await Shipment.create({
            nomeCliente: payload.to.name,
            transportadora: etiqueta.service.name,
            codigoRastreio: etiqueta.id,   // 👈 aqui salva o ID REAL
            preco: etiqueta.price,
            status: "aguardando_pagamento",
            origem: "Melhor Envio"
        });

        res.status(201).json({
            ...nova.toObject(),
            melhorEnvioId: etiqueta.id
        });

    } catch (error) {
        console.error("❌ Erro ao criar etiqueta (checkout):", error.response?.data || error.message);
        res.status(500).json({
            message: "Erro ao criar etiqueta (checkout) no Melhor Envio.",
            details: error.response?.data || error.message
        });
    }
};


// --- Pré-visualizar etiqueta (PDF) ---
// Rota do ME: POST /api/v2/me/shipment/preview  { shipments: [ "<ID DA ETIQUETA>" ] }
const previewMelhorEnvioLabel = async (req, res) => {
    try {
        const { id } = req.params;

        const response = await axios.post(
            `${ME_BASE_URL}/api/v2/me/shipment/preview`,
            { shipments: [id] },
            {
                headers: meHeaders(),
                responseType: "arraybuffer", // PDF
            }
        );

        res.setHeader("Content-Type", "application/pdf");
        res.send(response.data);
    } catch (error) {
        const msg = error?.response?.data || error.message;
        console.error("❌ Erro ao gerar pré-visualização:", msg);
        res.status(500).json({ message: "Erro ao gerar prévia da etiqueta", details: msg });
    }
};

// --- Pagar etiqueta ---
// Rota do ME: POST /api/v2/me/shipment/pay { orders: [ "<ID DA ETIQUETA>" ] }
const payMelhorEnvioLabel = async (req, res) => {
    try {
        const { id } = req.params;

        await axios.post(
            `${ME_BASE_URL}/api/v2/me/shipment/pay`,
            { shipments: [id] },   // 👈 mudar orders → shipments
            { headers: meHeaders() }
        );

        await Shipment.findOneAndUpdate(
            { codigoRastreio: id },
            { status: "pago" },
            { new: true }
        );

        res.status(200).json({ message: "Etiqueta paga com sucesso!" });
    } catch (error) {
        const msg = error?.response?.data || error.message;
        console.error("❌ Erro ao pagar etiqueta:", msg);
        res.status(500).json({ message: "Erro ao pagar etiqueta", details: msg });
    }
};


// --- Imprimir etiqueta (PDF definitivo) ---
// Rota do ME: POST /api/v2/me/shipment/print { shipments: [ "<ID DA ETIQUETA>" ] }
const printMelhorEnvioLabel = async (req, res) => {
    try {
        const { id } = req.params;

        await axios.post(
            `${ME_BASE_URL}/api/v2/me/shipment/print`,
            { shipments: [id] },  // 👈 precisa de ID válido
            { headers: meHeaders(), responseType: "arraybuffer" }
        );

        res.setHeader("Content-Type", "application/pdf");
        res.send(response.data);
    } catch (error) {
        const msg = error?.response?.data || error.message;
        console.error("❌ Erro ao imprimir etiqueta:", msg);
        res.status(500).json({ message: "Erro ao imprimir etiqueta", details: msg });
    }
};

module.exports = {
    createMelhorEnvioLabel,
    previewMelhorEnvioLabel,
    payMelhorEnvioLabel,
    printMelhorEnvioLabel,
};
