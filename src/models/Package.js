// src/models/Package.js
const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // Garante que não haja duas embalagens com o mesmo nome
    },
    weight: {
        type: Number,
        required: true // Peso da embalagem vazia
    },
    dimensions: {
        height: { type: Number, required: true },
        width: { type: Number, required: true },
        length: { type: Number, required: true }
    }
}, {
    timestamps: true
});

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
