// src/models/Settings.js
const mongoose = require('mongoose');

// Esta é a "planta" para os dados de configuração da sua empresa
const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true
    },
    cnpj: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    address: {
        street: String,
        number: String,
        complement: String,
        bairro: String, // O campo que faltava
        city: String,
        state: String,
        postalCode: String
    },
}, {
    // Esta opção garante que teremos apenas UM documento de configuração no banco
    capped: { size: 1024, max: 1 }
});

// Aqui criamos a ferramenta (Model) que nos permite interagir com o banco de dados
const Settings = mongoose.model('Settings', settingsSchema);

// Exportamos o Model para que outros arquivos do nosso projeto possam usá-lo
module.exports = Settings;
