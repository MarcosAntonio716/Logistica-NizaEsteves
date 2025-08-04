// src/models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true // Nome completo é obrigatório
    },
    cpf_cnpj: {
        type: String // Opcional
    },
    email: {
        type: String // Opcional
    },
    phone: {
        type: String // Opcional
    },
    address: {
        street: String,
        number: String,
        complement: String,
        bairro: String,
        city: String,
        state: String,
        postalCode: {
            type: String,
            required: true // CEP é obrigatório
        }
    }
}, {
    // Adiciona campos "createdAt" e "updatedAt" automaticamente
    timestamps: true 
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
