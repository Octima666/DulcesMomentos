/**
 * ============================================================================
 * PASTELERÍA "DULCES MOMENTOS" - SERVIDOR BACKEND (server.js)
 * Node.js + Express + Mercado Pago SDK v2 Official
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------------------------------
// 1. MIDDLEWARES
// ----------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '.')));

// ----------------------------------------------------------------------------
// 2. INICIALIZACIÓN DEL SDK OFICIAL V2 DE MERCADO PAGO
// ----------------------------------------------------------------------------
// Reemplaza 'TU_ACCESS_TOKEN_AQUI' con tu Access Token de Mercado Pago (o usa variables de entorno)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TU_ACCESS_TOKEN_AQUI';

const client = new MercadoPagoConfig({ 
  accessToken: MP_ACCESS_TOKEN 
});

// ----------------------------------------------------------------------------
// 3. ENDPOINT POST /api/crear-preferencia
// ----------------------------------------------------------------------------
app.post('/api/crear-preferencia', async (req, res) => {
  try {
    const { items, cliente } = req.body;

    // Validación básica del carrito
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'El carrito no contiene productos válidos.' 
      });
    }

    // Mapeo de items para la API de Mercado Pago v2
    const mpItems = items.map((item, index) => {
      const precioUnitario = Number(item.unit_price || item.precio || item.price || 0);
      const cantidad = Number(item.quantity || item.cantidad || 1);
      const titulo = item.title || item.nombre || `Producto ${index + 1}`;

      return {
        id: item.id ? String(item.id) : `item-${index + 1}`,
        title: String(titulo),
        quantity: cantidad,
        unit_price: precioUnitario,
        currency_id: 'ARS',
        description: item.topping ? `Topping: ${item.topping}` : undefined
      };
    });

    // Detectar URL base para los retornos
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || `localhost:${PORT}`;
    const baseUrl = `${protocol}://${host}`;

    // Instancia de Preference con el SDK v2
    const preference = new Preference(client);

    const preferenceData = {
      body: {
        items: mpItems,
        payer: {
          name: cliente?.nombre ? String(cliente.nombre) : 'Cliente',
          surname: '',
          email: cliente?.email || 'cliente@dulcesmomentos.com',
          phone: {
            area_code: '',
            number: cliente?.telefono ? String(cliente.telefono).replace(/\D/g, '') : ''
          },
          address: {
            street_name: cliente?.direccion || 'Puerto Iguazú, Misiones'
          }
        },
        back_urls: {
          success: `${baseUrl}/index.html?status=success`,
          failure: `${baseUrl}/index.html?status=failure`,
          pending: `${baseUrl}/index.html?status=pending`
        },
        auto_return: 'approved',
        statement_descriptor: 'Dulces Momentos',
        external_reference: `DM-${Date.now()}`
      }
    };

    const result = await preference.create(preferenceData);

    console.log(`[Mercado Pago] Preferencia creada exitosamente con ID: ${result.id}`);

    // Respuesta con id e init_point requerido
    return res.status(200).json({
      id: result.id,
      init_point: result.init_point || result.sandbox_init_point,
      sandbox_init_point: result.sandbox_init_point
    });

  } catch (error) {
    console.error('[Mercado Pago API Error]:', error);
    return res.status(500).json({
      error: 'Error al generar la preferencia de pago en Mercado Pago.',
      details: error.message || error
    });
  }
});

// Endpoint de verificación de estado
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Dulces Momentos API', timestamp: new Date().toISOString() });
});

// ----------------------------------------------------------------------------
// 4. INICIAR SERVIDOR
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🍰 Pastelería Dulces Momentos - Servidor Backend`);
  console.log(`🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`💳 Endpoint Preferencias MP: http://localhost:${PORT}/api/crear-preferencia`);
  console.log(`======================================================\n`);
});
