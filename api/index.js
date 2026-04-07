const axios = require('axios');

const TRESGUERRAS_USER = 'MAT00207379';
const TRESGUERRAS_PASS = process.env.TRESGUERRAS_PASS || 'VkZWR1ZVMUVRWGxOUkdONlRucHNSRlF3TlZWVmEwWlVVbU5QVWxGVlJrUldSazVEVXpCV1dnPT0=';
const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

module.exports = async (req, res) => {
  // 🔥 CORS CORRECTO
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check
  if (req.url === '/' && req.method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Cotización
  if (req.url === '/cotizar' && req.method === 'POST') {
    try {
      const payload = {
        ...req.body,
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS
      };

      console.log('📦 Recibido payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${TRESGUERRAS_BASE_URL}?action=ApiCotizacion`,
        payload,
        { 
          headers: { 'Content-Type': 'application/json' }, 
          timeout: 30000 
        }
      );

      console.log('✅ Respuesta Tresguerras:', response.data);
      return res.status(200).json(response.data);
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('Respuesta error:', error.response.data);
      }
      return res.status(500).json({
        error: true,
        descripcion_error: error.message || 'Error en API Tresguerras'
      });
    }
  }

  return res.status(404).json({ error: 'Endpoint no encontrado' });
};