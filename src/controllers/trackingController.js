// src/controllers/trackingController.js
const axios = require('axios');
const { getCorreiosToken } = require('./freightController');

const trackPackage = async (req, res) => {
    const trackingCode = req.params.code;

    if (!trackingCode) {
        return res.status(400).json({ message: 'Código de rastreio não fornecido.' });
    }

    try {
        const token = await getCorreiosToken();

        const response = await axios.get(
            `https://api.correios.com.br/srorastro/v1/objetos/${trackingCode}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const trackingData = response.data.objetos[0];

        if (trackingData.mensagem) {
            return res.status(404).json({ message: trackingData.mensagem });
        }

        // Adiciona campo "trajetoFormatado" em cada evento
        trackingData.eventos = trackingData.eventos.map(evento => {
            const origem = evento.unidade?.nome || '';
            const origemLocal = evento.unidade?.endereco
                ? `${evento.unidade.endereco.cidade} - ${evento.unidade.endereco.uf}`
                : '';

            const destino = evento.unidadeDestino?.nome || '';
            const destinoLocal = evento.unidadeDestino?.endereco
                ? `${evento.unidadeDestino.endereco.cidade} - ${evento.unidadeDestino.endereco.uf}`
                : '';

            let trajeto = 'Local não informado';

            if (evento.unidade?.endereco?.cidade && evento.unidade?.endereco?.uf) {
                trajeto = `${evento.unidade.endereco.cidade} - ${evento.unidade.endereco.uf}`;
            }

            if (evento.unidadeDestino?.endereco?.cidade && evento.unidadeDestino?.endereco?.uf) {
                const destinoStr = `${evento.unidadeDestino.endereco.cidade} - ${evento.unidadeDestino.endereco.uf}`;
                trajeto = `de ${trajeto} para ${destinoStr}`;
            }


            return {
                ...evento,
                trajetoFormatado: trajeto
            };
        });

        // Agora o trackingData.eventos já está formatado e pode ser enviado
        console.dir(trackingData.eventos, { depth: null });

        res.status(200).json(trackingData);

    } catch (error) {
        console.error('❌ Erro ao rastrear encomenda:', error.response ? (error.response.data.msgs || error.response.data) : error.message);
        res.status(500).json({ message: 'Falha ao rastrear encomenda.', error: error.message });
    }
};

module.exports = {
    trackPackage,
};
