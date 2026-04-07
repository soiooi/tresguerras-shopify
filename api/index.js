const axios = require('axios');

const TRESGUERRAS_USER = 'MAT00207379';
const TRESGUERRAS_PASS = process.env.TRESGUERRAS_PASS || 'VkZWR1ZVMUVRWGxOUkdONlRucHNSRlF3TlZWVmEwWlVVbU5QVWxGVlJrUldSazVEVXpCV1dnPT0=';
const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Endpoint raíz
  if (req.method === 'GET' && req.url === '/') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'API Tresguerras funcionando correctamente'
    });
  }

  // Endpoint /cotizar
  if (req.method === 'POST' && req.url === '/cotizar') {
    try {
      console.log('Recibiendo cotización...');
      
      const payload = {
        ...req.body,
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS
      };

      const response = await axios.post(
        `${TRESGUERRAS_BASE_URL}?action=ApiCotizacion`,
        payload,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      return res.status(200).json(response.data);
      
    } catch (error) {
      console.error('Error:', error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.message
      });
    }
  }

  // Si no encuentra la ruta
  return res.status(404).json({ 
    error: true, 
    message: `Ruta ${req.method} ${req.url} no encontrada`
  });
};