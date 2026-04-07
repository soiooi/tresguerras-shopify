const axios = require('axios');

// Credenciales de Tresguerras
const TRESGUERRAS_USER = 'MAT00207379';
const TRESGUERRAS_PASS = 'VkZWR1ZVMUVRWGxOUkdONlRucHNSRlF3TlZWVmEwWlVVbU5QVWxGVlJrUldSazVDVXpCV1dnPT0=';

const TRESGUERRAS_BASE_URL = 'https://wsa.tresguerras.com.mx/services/apiTest/CustomerApi/WS_CocinasIndustriales/';

// Catálogos SAT oficiales (según la infografía)
const SAT_CATALOGOS = {
  productos: {
    'COCINA': '47121801',
    'HORNO': '47121802',
    'PARRILLA': '47121803',
    'CAMPANA': '40101902',
    'MESA': '47121804',
    'REFRIGERADOR': '47121805',
    'LAVADORAS': '47121806',
    'default': '47121899'
  },
  embalajes: {
    'CAJA_CARTON': '1A',
    'CAJA_MADERA': '1B',
    'PALET': '2A',
    'default': '1A'
  },
  claseBulto: {
    'CAJA': '1',
    'PAQUETE': '2',
    'PALET': '3',
    'default': '1'
  }
};

// Función para detectar tipo de producto automáticamente
function detectarTipoProducto(titulo, productType, vendor) {
  const texto = `${titulo} ${productType} ${vendor}`.toLowerCase();
  
  if (texto.includes('cocina') || texto.includes('estufa')) return 'COCINA';
  if (texto.includes('horno')) return 'HORNO';
  if (texto.includes('parrilla') || texto.includes('asador')) return 'PARRILLA';
  if (texto.includes('campana')) return 'CAMPANA';
  if (texto.includes('mesa') || texto.includes('tabla')) return 'MESA';
  if (texto.includes('refrigerador') || texto.includes('congelador')) return 'REFRIGERADOR';
  if (texto.includes('lavadora')) return 'LAVADORAS';
  return 'default';
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
      sat_compliant: true,
      endpoints: ['/cotizar', '/catalogos', '/generar-guia', '/rastrear']
    });
  }

  // Endpoint: Obtener catálogos SAT
  if (req.method === 'GET' && req.url === '/catalogos') {
    return res.status(200).json({
      sat: SAT_CATALOGOS,
      nota: 'Usa estas claves para el complemento Carta Porte del SAT',
      url_oficial: 'http://omawww.sat.gob.mx/tramitesyservicios/Paginas/complemento_carta_porte.htm'
    });
  }

  // Endpoint: Cotizar envío
  if (req.method === 'POST' && req.url === '/cotizar') {
    try {
      const { cp_destino, items, total_weight, total_value, cp_origen = '72000' } = req.body;

      if (!cp_destino) {
        return res.status(400).json({
          error: true,
          descripcion_error: 'El código postal de destino es requerido'
        });
      }

      // Calcular medidas reales basadas en los items del carrito
      const pesoTotal = total_weight || 10; // kg
      const volumenTotal = items?.reduce((acc, item) => {
        // Si el producto tiene dimensiones reales, úsalas
        const alto = item.properties?.alto || item.product?.metafields?.alto?.value || 0.30;
        const ancho = item.properties?.ancho || item.product?.metafields?.ancho?.value || 0.30;
        const largo = item.properties?.largo || item.product?.metafields?.largo?.value || 0.30;
        return acc + (alto * ancho * largo) * item.quantity;
      }, 0) || 0.027; // 0.3*0.3*0.3 = 0.027m3 por defecto

      // Determinar tipo de producto principal
      const tipoProducto = items?.[0] ? detectarTipoProducto(
        items[0].title,
        items[0].product_type || '',
        items[0].vendor || ''
      ) : 'default';

      // Construir medidas con datos reales
      const medidas = [{
        no_bultos: items?.reduce((acc, item) => acc + item.quantity, 0) || 1,
        contenido: items?.map(i => `${i.quantity}x ${i.title}`).join(', ') || 'Productos',
        alto: Math.max(0.20, Math.min(2.0, Math.pow(volumenTotal, 1/3) || 0.30)),
        ancho: Math.max(0.20, Math.min(2.0, Math.pow(volumenTotal, 1/3) || 0.30)),
        largo: Math.max(0.20, Math.min(2.0, Math.pow(volumenTotal, 1/3) || 0.30)),
        peso: pesoTotal,
        sat_claseBulto: SAT_CATALOGOS.claseBulto.default,
        sat_producto: SAT_CATALOGOS.productos[tipoProducto],
        sat_material_peligroso: '',
        sat_embalaje: SAT_CATALOGOS.embalajes.default
      }];

      const payload = {
        cp_origen: cp_origen,
        cp_destino: cp_destino,
        bandera_recoleccion: 'S',
        bandera_ead: 'S',
        retencion_iva_cliente: 'N',
        referencia: `COT-${Date.now()}`,
        valor_declarado: total_value || 0,
        observaciones: items?.map(i => `${i.title}: ${i.quantity} piezas`).join('; ') || '',
        medidas: medidas,
        aRemitente: {
          rfc: 'XAXX010101000',
          nombre: 'Equipos y Cocinas Industriales de Puebla',
          direccion: 'Av. Principal 123',
          codigoPostal: cp_origen,
          num_ext: '123',
          num_int: '',
          colonia: 'Centro',
          email: 'ventas@equiposcocinas.com',
          telefono: '2221234567'
        },
        aDestinatario: req.body.destinatario || {
          rfc: 'XAXX010101000',
          nombre: 'Cliente',
          direccion: req.body.direccion || '',
          codigoPostal: cp_destino,
          num_ext: req.body.num_ext || '',
          num_int: req.body.num_int || '',
          colonia: req.body.colonia || '',
          email: req.body.email || '',
          telefono: req.body.telefono || ''
        },
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS
      };

      console.log('📤 Cotizando:', { cp_destino, peso: pesoTotal, items: items?.length });

      const response = await axios.post(
        `${TRESGUERRAS_BASE_URL}?action=ApiCotizacion`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );

      return res.status(200).json(response.data);
      
    } catch (error) {
      console.error('❌ Error cotización:', error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.response?.data?.descripcion_error || error.message
      });
    }
  }

  // Endpoint: Generar guía
  if (req.method === 'POST' && req.url === '/generar-guia') {
    try {
      const {
        cp_origen = '72000',
        cp_destino,
        items,
        total_weight,
        total_value,
        destinatario,
        fecha_recoleccion
      } = req.body;

      if (!cp_destino || !destinatario?.nombre) {
        return res.status(400).json({
          error: true,
          descripcion_error: 'Faltan datos: cp_destino y datos del destinatario son requeridos'
        });
      }

      const pesoTotal = total_weight || 10;
      const tipoProducto = items?.[0] ? detectarTipoProducto(
        items[0].title,
        items[0].product_type || '',
        items[0].vendor || ''
      ) : 'default';

      const medidas = [{
        no_bultos: items?.reduce((acc, item) => acc + item.quantity, 0) || 1,
        contenido: items?.map(i => `${i.quantity}x ${i.title}`).join(', ') || 'Productos',
        alto: 0.30,
        ancho: 0.30,
        largo: 0.30,
        peso: pesoTotal,
        sat_claseBulto: SAT_CATALOGOS.claseBulto.default,
        sat_producto: SAT_CATALOGOS.productos[tipoProducto],
        sat_material_peligroso: '',
        sat_embalaje: SAT_CATALOGOS.embalajes.default
      }];

      const payload = {
        cp_origen: cp_origen,
        cp_destino: cp_destino,
        bandera_recoleccion: 'S',
        bandera_ead: 'S',
        retencion_iva_cliente: 'N',
        referencia: `GUI-${Date.now()}`,
        valor_declarado: total_value || 0,
        observaciones: `Pedido: ${items?.map(i => i.title).join(', ')}`,
        fecha_recoleccion: fecha_recoleccion || new Date().toISOString().split('T')[0],
        medidas: medidas,
        aRemitente: {
          rfc: 'XAXX010101000',
          nombre: 'Equipos y Cocinas Industriales de Puebla',
          direccion: 'Av. Principal 123',
          codigoPostal: cp_origen,
          num_ext: '123',
          num_int: '',
          colonia: 'Centro',
          email: 'ventas@equiposcocinas.com',
          telefono: '2221234567'
        },
        aDestinatario: {
          rfc: destinatario.rfc || 'XAXX010101000',
          nombre: destinatario.nombre,
          direccion: destinatario.direccion,
          codigoPostal: cp_destino,
          num_ext: destinatario.num_ext || '',
          num_int: destinatario.num_int || '',
          colonia: destinatario.colonia || '',
          email: destinatario.email || '',
          telefono: destinatario.telefono || ''
        },
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS
      };

      console.log('📦 Generando guía para:', destinatario.nombre);

      const response = await axios.post(
        `${TRESGUERRAS_BASE_URL}?action=ApiGuia`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );

      return res.status(200).json(response.data);
      
    } catch (error) {
      console.error('❌ Error generar guía:', error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.response?.data?.descripcion_error || error.message
      });
    }
  }

  // Endpoint: Rastrear guía
  if (req.method === 'POST' && req.url === '/rastrear') {
    try {
      const { numero_guia, type = '00' } = req.body;

      if (!numero_guia) {
        return res.status(400).json({
          error: true,
          descripcion_error: 'El número de guía es requerido'
        });
      }

      const payload = {
        type: type,
        rastreo: numero_guia,
        Access_Usr: TRESGUERRAS_USER,
        Access_Pass: TRESGUERRAS_PASS
      };

      console.log('🔍 Rastreando guía:', numero_guia);

      const response = await axios.post(
        `${TRESGUERRAS_BASE_URL}?action=ApiRastreo`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );

      return res.status(200).json(response.data);
      
    } catch (error) {
      console.error('❌ Error rastreo:', error.message);
      return res.status(500).json({
        error: true,
        descripcion_error: error.response?.data?.descripcion_error || error.message
      });
    }
  }

  return res.status(404).json({ error: 'Ruta no encontrada' });
};