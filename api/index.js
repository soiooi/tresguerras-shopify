const axios = require('axios');

// Credenciales de Tresguerras (igual que en Postman)
const TRESGUERRAS_USER = 'MAT00207379';
const TRESGUERRAS_PASS = 'VkZWR1ZVMUVRWGxOUkdONlRucHNSRlF3TlZWVmEwWlVVbU5QVWxGVlJrUldSazVDVXpCV1dnPT0=';

const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

// Catálogos SAT predefinidos (puedes expandir según tus productos)
const SAT_CATALOGOS = {
  // Claves de producto comunes para equipos de cocina industrial
  productos: {
    'COCINA': '47121801',  // Cocinas industriales
    'HORNO': '47121802',   // Hornos
    'PARRILLA': '47121803', // Parrillas
    'CAMPANA': '40101902',  // Campanas extractoras
    'MESA': '47121804',     // Mesas de acero inoxidable
    'default': '47121899'   // Otros equipos
  },
  
  // Tipos de embalaje SAT
  embalajes: {
    'CAJA': '1A',      // Caja de cartón
    'PALET': '2A',     // Pallet
    'default': '1A'
  },
  
  // Clases de bulto
  claseBulto: {
    'CAJA': '1',       // Caja
    'PAQUETE': '2',    // Paquete
    'default': '1'
  }
};

// Función para determinar la clave SAT según el contenido
function getClaveSAT(contenido, tipo = 'producto') {
  if (tipo === 'producto') {
    const lowerContent = contenido.toLowerCase();
    if (lowerContent.includes('cocina')) return SAT_CATALOGOS.productos.COCINA;
    if (lowerContent.includes('horno')) return SAT_CATALOGOS.productos.HORNO;
    if (lowerContent.includes('parrilla')) return SAT_CATALOGOS.productos.PARRILLA;
    if (lowerContent.includes('campana')) return SAT_CATALOGOS.productos.CAMPANA;
    if (lowerContent.includes('mesa')) return SAT_CATALOGOS.productos.MESA;
    return SAT_CATALOGOS.productos.default;
  }
  return SAT_CATALOGOS.embalajes.default;
}

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
      message: 'API Tresguerras funcionando',
      version: '2.0',
      sat_compliant: true
    });
  }

  // Endpoint cotizar
  if (req.method === 'POST' && req.url === '/cotizar') {
    try {
      // Validar datos mínimos requeridos
      if (!req.body.cp_origen || !req.body.cp_destino) {
        return res.status(400).json({
          error: true,
          descripcion_error: 'Faltan datos: cp_origen y cp_destino son requeridos'
        });
      }

      // Procesar medidas y agregar campos SAT si no vienen
      const medidas = req.body.medidas.map(medida => ({
        no_bultos: medida.no_bultos || 1,
        contenido: medida.contenido || 'Equipo de cocina',
        alto: medida.alto || 0.30,
        ancho: medida.ancho || 0.30,
        largo: medida.largo || 0.30,
        peso: medida.peso || 10,
        // Usar valores SAT proporcionados o calcular automáticamente
        sat_claseBulto: medida.sat_claseBulto || SAT_CATALOGOS.claseBulto.default,
        sat_producto: medida.sat_producto || getClaveSAT(medida.contenido || 'equipo', 'producto'),
        sat_material_peligroso: medida.sat_material_peligroso || '', // Vacío si no es peligroso
        sat_embalaje: medida.sat_embalaje || SAT_CATALOGOS.embalajes.default
      }));

      // Construir el payload completo según documentación
      const payload = {
        cp_origen: req.body.cp_origen,
        cp_destino: req.body.cp_destino,
        bandera_recoleccion: req.body.bandera_recoleccion || 'S',
        bandera_ead: req.body.bandera_ead || 'S',
        retencion_iva_cliente: req.body.retencion_iva_cliente || 'N',
        referencia: req.body.referencia || `COT-${Date.now()}`,
        valor_declarado: req.body.valor_declarado || 0,
        observaciones: req.body.observaciones || '',
        fecha_recoleccion: req.body.fecha_recoleccion || '',
        medidas: medidas,
        aRemitente: req.body.aRemitente || {
          rfc: 'XAXX010101000',
          nombre: 'Cliente',
          direccion: 'Dirección',
          codigoPostal: req.body.cp_origen,
          num_ext: '0',
          num_int: '',
          colonia: '',
          email: '',
          telefono: ''
        },
        aDestinatario: req.body.aDestinatario || {
          rfc: 'XAXX010101000',
          nombre: 'Destinatario',
          direccion: '',
          codigoPostal: req.body.cp_destino,
          num_ext: '',
          num_int: '',
          colonia: '',
          email: '',
          telefono: ''
        },
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS
      };

      console.log('📤 Enviando a Tresguerras...');
      console.log('📍 Origen:', payload.cp_origen);
      console.log('📍 Destino:', payload.cp_destino);
      console.log('📦 Medidas:', JSON.stringify(medidas, null, 2));

      const response = await axios.post(
        `${TRESGUERRAS_BASE_URL}?action=ApiCotizacion`,
        payload,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      console.log('✅ Respuesta recibida');

      // Agregar información de los catálogos SAT usados en la respuesta
      const responseData = {
        ...response.data,
        _sat_info: {
          productos_usados: medidas.map(m => ({ 
            contenido: m.contenido, 
            clave_sat: m.sat_producto 
          })),
          mensaje: 'Asegúrate de usar las claves SAT correctas según el catálogo oficial'
        }
      };

      return res.status(200).json(responseData);
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.response?.data?.descripcion_error || error.message,
        codigo: error.response?.status || 500
      });
    }
  }

  // Endpoint para obtener catálogos SAT (útil para el frontend)
  if (req.method === 'GET' && req.url === '/catalogos') {
    return res.status(200).json({
      sat: SAT_CATALOGOS,
      nota: 'Estos son catálogos de ejemplo. Debes usar los oficiales del SAT.',
      url_oficial: 'http://omawww.sat.gob.mx/tramitesyservicios/Paginas/complemento_carta_porte.htm'
    });
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};