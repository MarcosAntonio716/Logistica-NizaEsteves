// src/controllers/freightController.js

const axios = require('axios');

// --- Bloco de Cache para o Token dos Correios ---
let correiosTokenCache = {
    token: null,
    expiresAt: null,
};

// --- FUNÇÃO PARA GERAR UM NOVO TOKEN DOS CORREIOS ---
const getCorreiosToken = async () => {
    const now = new Date();
    if (correiosTokenCache.token && correiosTokenCache.expiresAt > now) {
        return correiosTokenCache.token;
    }

    const user = process.env.CORREIOS_USER;
    const password = process.env.CORREIOS_PASSWORD;
    const credentials = Buffer.from(`${user}:${password}`).toString('base64');

    try {
        const response = await axios.post(
            'https://api.correios.com.br/token/v1/autentica/cartaopostagem',
            { numero: process.env.CORREIOS_CARTAO_POSTAGEM },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                }
            }
         );

        const tokenData = response.data;
        const issueDate = new Date(tokenData.issue);
        const expirationDate = new Date(issueDate.getTime() + (parseInt(tokenData.expiraEm) - 300000));

        correiosTokenCache = {
            token: tokenData.token,
            expiresAt: expirationDate,
        };

        console.log('✅ Novo token dos Correios (via Cartão) gerado com sucesso.');
        return correiosTokenCache.token;

    } catch (error) {
        console.error("❌ ERRO ao gerar token dos Correios:", error.response ? error.response.data : error.message);
        throw new Error('Falha na autenticação com os Correios.');
    }
};

// --- FUNÇÃO PARA CHAMAR A API DO MELHOR ENVIO ---
const fetchMelhorEnvioQuotes = (payload) => {
    return axios.post(
        'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
        payload,
        {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
                'User-Agent': 'App Niza Esteves Logistica',
            },
        }
     );
};

// --- FUNÇÃO PARA CHAMAR A API DE PREÇOS DOS CORREIOS ---
const fetchCorreiosQuotes = async (payload) => {
    const token = await getCorreiosToken();

    console.log("📦 Payload recebido no backend:", JSON.stringify(payload, null, 2));

    if (
        !payload.package ||
        !payload.package.weight ||
        !payload.package.length ||
        !payload.package.width ||
        !payload.package.height
    ) {
        throw new Error("❌ Dados do pacote incompletos ou inválidos.");
    }

    const produtos = ["03220", "03298"]; // SEDEX e PAC

    const lote = produtos.map((produto) => ({
        // idLote foi removido, pois não é usado pela API de Preços
        coProduto: produto,
        nuCepOrigem: payload.from.postal_code.replace(/\D/g, ''),
        nuCepDestino: payload.to.postal_code.replace(/\D/g, ''),
        psObjeto: Math.round(payload.package.weight * 1000), // Enviado como number
        tpObjeto: "2", // Pacote/Caixa
        comprimento: payload.package.length, // Enviado como number
        largura: payload.package.width,     // Enviado como number
        altura: payload.package.height,       // Enviado como number
    }));

    console.log("📤 Corpo enviado para os Correios:", JSON.stringify(lote, null, 2));

    const response = await axios.post(
        'https://api.correios.com.br/preco/v1/nacional',
        lote,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }
     );

    console.log("✅ Resposta Correios:", JSON.stringify(response.data, null, 2));

    // A resposta da API de preços não inclui o prazo, então vamos ajustar o mapeamento
    return response.data
        .filter(servico => !servico.msgErro)
        .map(servico => ({
            id: servico.coProduto,
            name: servico.coProduto === '03298' ? 'PAC Contrato' : 'SEDEX Contrato',
            price: servico.pcFinal.replace(',', '.'),
            // A API de Preços não retorna o prazo. Você precisaria de uma chamada separada para a API de Prazos.
            delivery_time: 'N/A', 
            company: {
                name: 'Correios (Contrato)',
                picture: 'https://www.melhorenvio.com.br/images/shipping-companies/correios.png'
            }
        } ));
};


// --- CONTROLLER PRINCIPAL ---
const calculateFreight = async (req, res) => {
    const payload = req.body;

    if (
        !payload ||
        !payload.from?.postal_code ||
        !payload.to?.postal_code ||
        !payload.package?.weight ||
        !payload.package?.length ||
        !payload.package?.width ||
        !payload.package?.height
    ) {
        return res.status(400).json({ message: '❌ Dados da cotação incompletos ou inválidos.' });
    }

    try {
        const [melhorEnvioResult, correiosResult] = await Promise.allSettled([
            fetchMelhorEnvioQuotes(payload),
            fetchCorreiosQuotes(payload)
        ]);

        let allQuotes = [];

        if (melhorEnvioResult.status === 'fulfilled') {
            allQuotes.push(...melhorEnvioResult.value.data.filter(q => !q.error));
        } else {
            console.error("Erro na chamada do Melhor Envio:", melhorEnvioResult.reason.message);
        }

        if (correiosResult.status === 'fulfilled') {
            allQuotes.push(...correiosResult.value);
        } else {
            const errorData = correiosResult.reason.response
                ? JSON.stringify(correiosResult.reason.response.data, null, 2)
                : correiosResult.reason.message;
            console.error("Erro na chamada dos Correios (API Nova):", errorData);
        }

        allQuotes.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        res.status(200).json(allQuotes);

    } catch (error) {
        console.error("Erro geral no calculateFreight:", error.message);
        res.status(500).json({ message: "Ocorreu um erro geral ao calcular o frete." });
    }
};

// Exporta tudo
module.exports = {
    calculateFreight,
    getCorreiosToken
};
