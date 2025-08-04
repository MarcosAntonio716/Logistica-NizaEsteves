// src/controllers/clientController.js
const Client = require('../models/Client'); // Importa o nosso "modelo" de Cliente

// --- Função para CRIAR um novo cliente ---
const createClient = async (req, res) => {
    try {
        const newClient = new Client(req.body);
        const savedClient = await newClient.save();
        res.status(201).json(savedClient); // 201 = Created
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar cliente.', error }); // 400 = Bad Request
    }
};

// --- Função para LISTAR TODOS os clientes ---
const getAllClients = async (req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar clientes.', error });
    }
};

// --- Função para BUSCAR um cliente específico pelo ID ---
const getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado.' }); // 404 = Not Found
        }
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar cliente.', error });
    }
};

// --- Função para ATUALIZAR um cliente ---
const updateClient = async (req, res) => {
    try {
        const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedClient) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }
        res.status(200).json(updatedClient);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao atualizar cliente.', error });
    }
};

// --- Função para APAGAR um cliente ---
const deleteClient = async (req, res) => {
    try {
        const deletedClient = await Client.findByIdAndDelete(req.params.id);
        if (!deletedClient) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }
        res.status(200).json({ message: 'Cliente apagado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar cliente.', error });
    }
};

// Exporta todas as funções para serem usadas nas rotas
module.exports = {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    deleteClient,
};
