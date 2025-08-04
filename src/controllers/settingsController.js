// src/controllers/settingsController.js
const Settings = require('../models/Settings'); // Importa o nosso "modelo" de dados

// Função para buscar as configurações
const getSettings = async (req, res) => {
    try {
        // Tenta encontrar o primeiro (e único) documento de configurações
        const settings = await Settings.findOne();
        if (!settings) {
            // Se não encontrar, retorna um objeto vazio
            return res.status(204).send(); // 204 No Content
        }
        // Se encontrar, retorna os dados
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar configurações.', error });
    }
};

// Função para salvar ou atualizar as configurações
const saveSettings = async (req, res) => {
    try {
        // Tenta encontrar as configurações existentes para atualizá-las.
        // Se não existirem, ele cria um novo documento.
        // O { new: true, upsert: true } garante esse comportamento.
        const updatedSettings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.status(200).json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar configurações.', error });
    }
};

module.exports = {
    getSettings,
    saveSettings,
};
