const axios = require('axios');

const TRESGUERRAS_USER = 'MAT00207379';
const TRESGUERRAS_PASS = process.env.TRESGUERRAS_PASS || 'VkZWR1ZVMUVRWGxOUkdONlRucHNSRlF3TlZWVmEwWlVVbU5QVWxGVlJrUldSazVEVXpCV1dnPT0=';
const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

module.exports = async (req, res) => {
  // Configurar CORS para que Shopify pueda llamar
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('📨 Request recibida:', req.method, req.url);

  // Health check - importante para Vercel
  if (req.url === '/' && req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'API Tresguerras funcionando'
    });
  }

  // Endpoint de cotización
  if (req.url === '/cotizar' && req.method === 'POST') {
    try {
      const payload = {
        ...req.body,
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS
      };

      console.log('📦 Enviando a Tresguerras:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${TRESGUERRAS_BASE_URL}?action=ApiCotizacion`,
        payload,
        { 
          headers: { 'Content-Type': 'application/json' }, 
          timeout: 30000 
        }
      );

      console.log('✅ Respuesta de Tresguerras:', response.data);
      return res.status(200).json(response.data);
      
    } catch (error) {
      console.error('❌ Error en cotización:', error.message);
      
      // Si es error de axios con respuesta
      if (error.response) {
        console.error('Respuesta error:', error.response.data);
        return res.status(error.response.status || 500).json({
          error: true,
          descripcion_error: error.response.data?.mensaje || error.message
        });
      }
      
      return res.status(500).json({
        error: true,
        descripcion_error: error.message || 'Error interno del servidor'
      });
    }
  }

  // Si no encuentra el endpoint
  return res.status(404).json({ 
    error: true, 
    descripcion_error: `Endpoint ${req.url} no encontrado` 
  });
};