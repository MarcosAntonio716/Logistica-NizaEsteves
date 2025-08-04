// src/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// Importa todos os arquivos de rotas
const freightRoutes = require('./routes/freightRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const clientRoutes = require('./routes/clientRoutes');
const packageRoutes = require('./routes/packageRoutes');
const trackingRoutes = require('./routes/trackingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configura os middlewares
app.use(express.json());
app.use(express.static('public'));

// Diz ao Express para usar os arquivos de rotas
app.use('/api/frete', freightRoutes);
app.use('/api', settingsRoutes);
app.use('/api', clientRoutes);
app.use('/api', packageRoutes);
app.use('/api', trackingRoutes);

// --- LÓGICA DE CONEXÃO COM O BANCO DE DADOS ---
console.log('Tentando conectar ao MongoDB...');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conexão com o MongoDB Atlas estabelecida com SUCESSO!');

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao conectar ao MongoDB:', err);
  });
