// src/controllers/trackingController.js
const axios = require('axios');
// IMPORTANTE: Importamos a nossa função de gerar token do outro controller.
const { getCorreiosToken } = require('./freightController');

const trackPackage = async (req, res) => {
    const trackingCode = req.params.code;

    if (!trackingCode) {
        return res.status(400).json({ message: 'Código de rastreio não fornecido.' });
    }

    try {
        // 1. Pega o mesmo token que usamos para a cotação
        const token = await getCorreiosToken();
        
        // 2. Faz a chamada para a nova API de rastreamento dos Correios
        const response = await axios.get(
            `https://api.correios.com.br/srorastro/v1/objetos/${trackingCode}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        // A API nova retorna um objeto com uma lista de objetos
        const trackingData = response.data.objetos[0];

        // Se houver uma mensagem de erro na resposta, envia para o frontend
        if (trackingData.mensagem) {
             return res.status(404).json({ message: trackingData.mensagem });
        }

        // Se der tudo certo, envia os dados do rastreamento
        res.status(200).json(trackingData);

    } catch (error) {
        console.error('Erro ao rastrear encomenda:', error.response ? (error.response.data.msgs || error.response.data) : error.message);
        res.status(500).json({ message: 'Falha ao rastrear encomenda.', error: error.message });
    }
};

module.exports = {
    trackPackage,
};