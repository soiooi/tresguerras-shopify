const axios = require('axios');

const TRESGUERRAS_USER = 'MAT00207379';
// Contraseña REAL después de 3 decodificaciones
const TRESGUERRAS_PASS = 'MAT00207379CONTRASEÑAACTSBKEY';

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
      console.log('🔐 Password:', '********');

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