// src/controllers/packageController.js
const Package = require('../models/Package');

// --- Função para CRIAR uma nova embalagem ---
const createPackage = async (req, res) => {
    try {
        const newPackage = new Package(req.body);
        const savedPackage = await newPackage.save();
        res.status(201).json(savedPackage);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar embalagem.', error });
    }
};

// --- Função para LISTAR TODAS as embalagens ---
const getAllPackages = async (req, res) => {
    try {
        const packages = await Package.find();
        res.status(200).json(packages);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar embalagens.', error });
    }
};

// --- Função para APAGAR uma embalagem ---
const deletePackage = async (req, res) => {
    try {
        const deletedPackage = await Package.findByIdAndDelete(req.params.id);
        if (!deletedPackage) {
            return res.status(404).json({ message: 'Embalagem não encontrada.' });
        }
        res.status(200).json({ message: 'Embalagem apagada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar embalagem.', error });
    }
};

module.exports = {
    createPackage,
    getAllPackages,
    deletePackage,
};
