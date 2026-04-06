const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const TRESGUERRAS_USER = 'MAT00207379';
const TRESGUERRAS_PASS = process.env.TRESGUERRAS_PASS;
const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

// COTIZACIÓN
app.post('/apps/tresguerras/cotizar', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      Access_Usr: TRESGUERRAS_USER,
      Access_Pass: TRESGUERRAS_PASS
    };

    const response = await axios.post(
      `${TRESGUERRAS_BASE_URL}?action=ApiCotizacion`,
      payload,
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: true,
      descripcion_error: error.message || 'Error en API Tresguerras'
    });
  }
});

// GUÍA
app.post('/apps/tresguerras/guia', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      Access_Usr: TRESGUERRAS_USER,
      Access_Pass: TRESGUERRAS_PASS
    };

    const response = await axios.post(
      `${TRESGUERRAS_BASE_URL}?action=ApiGuia`,
      payload,
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: true,
      descripcion_error: error.message
    });
  }
});

// RASTREO
app.post('/apps/tresguerras/rastreo', async (req, res) => {
  try {
    const payload = {
      type: '01',
      ...req.body,
      Access_Usr: TRESGUERRAS_USER,
      Access_Pass: TRESGUERRAS_PASS
    };

    const response = await axios.post(
      `${TRESGUERRAS_BASE_URL}?action=ApiRastreo`,
      payload,
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: true,
      descripcion_error: error.message
    });
  }
});

// SALUD
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});