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
            'https://api.correios.com.br/token/v1/autentica/contrato',
            { numero: process.env.CORREIOS_CONTRATO },
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
        
        console.log('Novo token dos Correios gerado com sucesso.');
        return correiosTokenCache.token;

    } catch (error) {
        console.error("ERRO GRAVE ao gerar token dos Correios:", error.response ? (error.response.data.msgs || error.response.data) : error.message);
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
    
    const correiosPayload = {
        "idLote": "1",
        "nuContrato": process.env.CORREIOS_CONTRATO,
        "nuCartaoPostagem": process.env.CORREIOS_CARTAO_POSTAGEM, // Usa o cartão de postagem
        "coProduto": "03220,03298",
        "nuCepOrigem": payload.from.postal_code.replace(/\D/g, ''),
        "nuCepDestino": payload.to.postal_code.replace(/\D/g, ''),
        "psObjeto": payload.package.weight.toString(),
        "tpObjeto": "2",
        "comprimento": payload.package.length.toString(),
        "largura": payload.package.width.toString(),
        "altura": payload.package.height.toString(),
    };

    const response = await axios.post(
        'https://api.correios.com.br/preco/v1/nacional',
        [correiosPayload], // A API espera uma lista
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    return response.data.map(servico => ({
        id: servico.coProduto,
        name: servico.coProduto === '03220' ? 'PAC Contrato' : 'SEDEX Contrato',
        price: servico.pcFinal.replace(',', '.'),
        delivery_time: servico.prazoEntrega,
        company: { name: 'Correios (Contrato)', picture: 'https://www.melhorenvio.com.br/images/shipping-companies/correios.png' }
    }));
};

// --- CONTROLLER PRINCIPAL ---
const calculateFreight = async (req, res) => {
    console.log("DADOS RECEBIDOS NO BACKEND:", req.body);
    const payload = req.body;

    if (!payload || !payload.from || !payload.to || !payload.package) {
        return res.status(400).json({ message: 'Dados da cotação incompletos.' });
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
            const errorData = correiosResult.reason.response ? (correiosResult.reason.response.data.msgs || correiosResult.reason.response.data) : correiosResult.reason.message;
            console.error("Erro na chamada dos Correios (API Nova):", errorData);
        }

        allQuotes.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        res.status(200).json(allQuotes);

    } catch (error) {
        console.error("Erro geral no calculateFreight:", error);
        res.status(500).json({ message: "Ocorreu um erro geral ao calcular o frete." });
    }
};

// Exportamos a função de gerar token para que o trackingController possa usá-la
module.exports = {
    calculateFreight,
    getCorreiosToken 
};
