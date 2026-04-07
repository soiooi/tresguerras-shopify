const axios = require('axios');

const TRESGUERRAS_USER = 'MAT00207379';
// Tomar la variable de entorno (que está en Base64)
const TRESGUERRAS_PASS_BASE64 = process.env.TRESGUERRAS_PASS || 'VkZWR1ZVMUVRWGxOUkdONlRucHNSRlF3TlZWVmEwWlVVbU5QVWxGVlJrUldSazVEVXpCV1dnPT0=';

// 🔑 FUNCIÓN: Decodificar Base64 recursivamente hasta obtener texto legible
function decodePassword(encoded, maxAttempts = 10) {
  let current = encoded;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const decoded = Buffer.from(current, 'base64').toString('utf8');
      
      // Si ya no parece Base64 (tiene espacios o caracteres no Base64)
      if (!/^[A-Z0-9+\/=]+$/i.test(decoded) || decoded.includes(' ')) {
        console.log(`✅ Decodificado después de ${i + 1} iteraciones`);
        return decoded;
      }
      
      current = decoded;
    } catch (e) {
      console.log(`⚠️ Decodificación detenida después de ${i} iteraciones`);
      return current;
    }
  }
  
  return current;
}

// Decodificar la contraseña
const TRESGUERRAS_PASS = decodePassword(TRESGUERRAS_PASS_BASE64);
console.log('🔑 Contraseña decodificada correctamente');

const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

module.exports = async (req, res) => {
  // CORS
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
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS,
        cp_origen: req.body.cp_origen,
        cp_destino: req.body.cp_destino,
        bandera_recoleccion: req.body.bandera_recoleccion,
        bandera_ead: req.body.bandera_ead,
        retencion_iva_cliente: req.body.retencion_iva_cliente,
        referencia: req.body.referencia,
        valor_declarado: req.body.valor_declarado,
        medidas: req.body.medidas
      };

      console.log('📤 Enviando a Tresguerras');
      console.log('👤 Usuario:', TRESGUERRAS_USER);

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