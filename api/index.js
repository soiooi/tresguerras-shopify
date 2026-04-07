const axios = require('axios');

const TRESGUERRAS_USER = 'MAT00207379';
// ⚠️ La contraseña está en Base64 - hay que decodificarla
const TRESGUERRAS_PASS_BASE64 = 'VkZWR1ZVMUVRWGxOUkdONlRucHNSRlF3TlZWVmEwWlVVbU5QVWxGVlJrUldSazVEVXpCV1dnPT0=';

// Decodificar la contraseña
const TRESGUERRAS_PASS = Buffer.from(TRESGUERRAS_PASS_BASE64, 'base64').toString('utf8');

const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check
  if (req.method === 'GET' && req.url === '/') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'API Tresguerras funcionando'
    });
  }

  // Endpoint cotizar
  if (req.method === 'POST' && req.url === '/cotizar') {
    try {
      const payload = {
        ...req.body,
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS  // Ahora usa la contraseña decodificada
      };

      console.log('📤 Enviando a Tresguerras con usuario:', TRESGUERRAS_USER);
      console.log('🔐 Contraseña (primeros 10 chars):', TRESGUERRAS_PASS.substring(0, 10) + '...');

      const response = await axios.post(
        `${TRESGUERRAS_BASE_URL}?action=ApiCotizacion`,
        payload,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      console.log('✅ Respuesta:', response.data);
      return res.status(200).json(response.data);
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.response?.data?.descripcion_error || error.message
      });
    }
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};