import axios from 'axios';

const TRESGUERRAS_USER = 'MAT00207379';
const TRESGUERRAS_PASS = process.env.TRESGUERRAS_PASS || 'VkZWR1ZVMUVRWGxOUkdONlRucHNSRlF3TlZWVmEwWlVVbU5QVWxGVlJrUldSazVEVXpCV1dnPT0=';
const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

const enableCors = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
};

export default async (req, res) => {
  if (enableCors(req, res)) return;

  if (req.url === '/' && req.method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  if (req.url === '/cotizar' && req.method === 'POST') {
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

      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error cotización:', error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.message || 'Error en API Tresguerras'
      });
    }
  }

  if (req.url === '/guia' && req.method === 'POST') {
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

      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error guía:', error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.message
      });
    }
  }

  if (req.url === '/rastreo' && req.method === 'POST') {
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

      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error rastreo:', error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.message
      });
    }
  }

  return res.status(404).json({ error: 'Endpoint no encontrado' });
};
