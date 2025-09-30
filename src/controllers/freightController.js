// src/controllers/freightController.js
const axios = require('axios');

// --- Cache para tokens ---
let correiosTokenContratoCache = { token: null, expiresAt: null };
let correiosTokenCartaoCache = { token: null, expiresAt: null };

// Timeout padrão
const AXIOS_OPTS = { timeout: 15000 };

// --- TOKEN POR CONTRATO ---
const getCorreiosTokenContrato = async () => {
    const now = new Date();
    if (correiosTokenContratoCache.token && correiosTokenContratoCache.expiresAt > now) {
        return correiosTokenContratoCache.token;
    }

    const user = process.env.CORREIOS_USER;        // CNPJ (sem máscara)
    const password = process.env.CORREIOS_PASSWORD; // senha/código azul
    const contrato = process.env.CORREIOS_CONTRATO;
    const dr = parseInt(process.env.CORREIOS_DR || '0', 10);

    const credentials = Buffer.from(`${user}:${password}`).toString('base64');

    try {
        const response = await axios.post(
            'https://api.correios.com.br/token/v1/autentica/contrato',
            {
                numero: contrato,
                dr: isNaN(dr) ? undefined : dr,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`,
                },
                ...AXIOS_OPTS,
            }
        );

        const tokenData = response.data;
        const exp = new Date(tokenData.expiraEm).getTime() - 5 * 60 * 1000;

        correiosTokenContratoCache = {
            token: tokenData.token,
            expiresAt: new Date(exp),
        };

        console.log('✅ Token Correios (CONTRATO) gerado com sucesso.');
        return correiosTokenContratoCache.token;
    } catch (error) {
        console.error('❌ ERRO token CONTRATO:', error.response ? error.response.data : error.message);
        throw new Error('Falha na autenticação com os Correios (Contrato).');
    }
};

// --- TOKEN POR CARTÃO ---
const getCorreiosTokenCartao = async () => {
    const now = new Date();
    if (correiosTokenCartaoCache.token && correiosTokenCartaoCache.expiresAt > now) {
        return correiosTokenCartaoCache.token;
    }

    const user = process.env.CORREIOS_USER;
    const password = process.env.CORREIOS_PASSWORD; // mesma senha azul
    const contrato = process.env.CORREIOS_CONTRATO;
    const cartao = process.env.CORREIOS_CARTAO;
    const dr = parseInt(process.env.CORREIOS_DR || '0', 10);

    const credentials = Buffer.from(`${user}:${password}`).toString('base64');

    try {
        const response = await axios.post(
            'https://api.correios.com.br/token/v1/autentica/cartaopostagem',
            {
                numero: cartao,
                contrato: contrato,
                dr: isNaN(dr) ? undefined : dr,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`,
                },
                ...AXIOS_OPTS,
            }
        );

        const tokenData = response.data;
        const exp = new Date(tokenData.expiraEm).getTime() - 5 * 60 * 1000;

        correiosTokenCartaoCache = {
            token: tokenData.token,
            expiresAt: new Date(exp),
        };

        console.log('✅ Token Correios (CARTÃO) gerado com sucesso.');
        return correiosTokenCartaoCache.token;
    } catch (error) {
        console.error('❌ ERRO token CARTÃO:', error.response ? error.response.data : error.message);
        throw new Error('Falha na autenticação com os Correios (Cartão).');
    }
};

// --- Preferência: tenta CONTRATO, se falhar tenta CARTÃO ---
const getCorreiosToken = async () => {
    try {
        return await getCorreiosTokenContrato();
    } catch (_) {
        console.warn('⚠️ Token por CONTRATO falhou, tentando por CARTÃO…');
        return await getCorreiosTokenCartao();
    }
};

// --- MELHOR ENVIO ---
const fetchMelhorEnvioQuotes = (payload) => {
    return axios.post(
        'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
        payload,
        {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
                'User-Agent': 'App Niza Esteves Logistica',
            },
            ...AXIOS_OPTS,
        }
    );
};

// --- CORREIOS: PREÇO + PRAZO ---
const fetchCorreiosQuotes = async (payload) => {
    const token = await getCorreiosToken();

    if (
        !payload.package ||
        !payload.package.weight ||
        !payload.package.length ||
        !payload.package.width ||
        !payload.package.height
    ) {
        throw new Error('❌ Dados do pacote incompletos ou inválidos.');
    }

    const produtos = ['03220', '03298']; // SEDEX e PAC contrato

    // --- PREÇO ---
    const parametrosProduto = produtos.map((produto, index) => ({
        coProduto: produto,
        nuRequisicao: String(index + 1),
        cepOrigem: payload.from.postal_code.replace(/\D/g, ''),
        cepDestino: payload.to.postal_code.replace(/\D/g, ''),
        psObjeto: Math.round(payload.package.weight * 1000),
        tpObjeto: '2',
        comprimento: String(payload.package.length),
        largura: String(payload.package.width),
        altura: String(payload.package.height),
    }));

    const precoBody = { idLote: '1', parametrosProduto };

    const precoResp = await axios.post('https://api.correios.com.br/preco/v1/nacional', precoBody, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    // --- PRAZO ---
    const parametrosPrazo = produtos.map((produto, index) => ({
        coProduto: produto,
        nuRequisicao: String(index + 1),
        cepOrigem: payload.from.postal_code.replace(/\D/g, ''),
        cepDestino: payload.to.postal_code.replace(/\D/g, ''),
    }));

    const prazoBody = { idLote: '1', parametrosPrazo };

    const prazoResp = await axios.post('https://api.correios.com.br/prazo/v1/nacional', prazoBody, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const precos = precoResp.data;
    const prazos = prazoResp.data;

    return precos
        .filter((servico) => !servico.msgErro)
        .map((servico) => {
            const prazo = prazos.find((p) => p.coProduto === servico.coProduto);
            return {
                id: servico.coProduto,
                name: servico.coProduto === '03298' ? 'PAC Contrato' : 'SEDEX Contrato',
                price: servico.pcFinal.replace(',', '.'),
                delivery_time: prazo ? prazo.prazoEntrega : 'N/A',
                company: {
                    name: 'Correios',
                    picture: 'https://www.melhorenvio.com.br/images/shipping-companies/correios.png',
                },
                source: 'Correios' // 👈 adicionado
            };
        });
};

// --- CONTROLLER ---
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
            fetchCorreiosQuotes(payload),
        ]);

        let allQuotes = [];

        if (melhorEnvioResult.status === 'fulfilled') {
            allQuotes.push(
                ...melhorEnvioResult.value.data
                    .filter((q) => !q.error)
                    .map((q) => ({
                        ...q,
                        source: 'Melhor Envio'   // 👈 origem adicionada
                    }))
            );
        } else {
            console.error(
                'Erro na chamada do Melhor Envio:',
                melhorEnvioResult.reason?.message || melhorEnvioResult.reason
            );
        }

        if (correiosResult.status === 'fulfilled') {
            allQuotes.push(
                ...correiosResult.value.map((q) => ({
                    ...q,
                    source: 'Correios'   // 👈 origem adicionada
                }))
            );
        } else {
            const err = correiosResult.reason;
            const errorData = err?.response
                ? JSON.stringify(err.response.data, null, 2)
                : err?.message || String(err);
            console.error('Erro na chamada dos Correios:', errorData);
        }


        allQuotes.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        res.status(200).json(allQuotes);
    } catch (error) {
        console.error('Erro geral no calculateFreight:', error.message);
        res.status(500).json({ message: 'Ocorreu um erro geral ao calcular o frete.' });
    }
};

module.exports = {
    calculateFreight,
    getCorreiosTokenContrato,
    getCorreiosTokenCartao,
    getCorreiosToken,
};
