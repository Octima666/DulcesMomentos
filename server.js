/**
 * ============================================================================
 * PASTELERÍA "DULCES MOMENTOS" - SERVIDOR BACKEND (server.js)
 * Node.js + Express + PostgreSQL + Mercado Pago SDK v2 Official
 * ============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Seguridad
const JWT_SECRET = process.env.JWT_SECRET || 'dulces_momentos_secret_key_2026_super_secure_jwt_token!';

// ----------------------------------------------------------------------------
// 1. MIDDLEWARES
// ----------------------------------------------------------------------------

// CORS restrictivo: solo acepta peticiones desde GitHub Pages y localhost
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://octima666.github.io',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',   // Live Server de VS Code
      'http://127.0.0.1:5500'
    ];
    // Permitir peticiones sin origen (ej: Postman, curl, mismo servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para origen: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir archivos estáticos del frontend (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '.')));

// ----------------------------------------------------------------------------
// 2. CONEXIÓN A BASE DE DATOS POSTGRESQL
// ----------------------------------------------------------------------------

// Configura la conexión usando DATABASE_URL (Render/Railway/Neon la proveen)
// Para local, configurar en .env: DATABASE_URL=postgresql://user:pass@localhost:5432/dulces_momentos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : false
});

async function initDatabase() {
  try {
    console.log('[PostgreSQL] Inicializando base de datos...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,
        correo VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[PostgreSQL] ✅ Tabla "usuarios" verificada/creada exitosamente.');
  } catch (error) {
    console.error('[PostgreSQL Error] Error al inicializar la base de datos:', error.message);
    throw error;
  }
}

// Inicializar la BD al arrancar el servidor
initDatabase().catch(err => {
  console.warn('[PostgreSQL] Advertencia: Error en inicialización inicial:', err.message);
});

// Middleware de verificación de autenticación JWT
const autenticarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Acceso no autorizado. Se requiere inicio de sesión.' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Sesión expirada o token inválido.' 
      });
    }
    req.usuario = decoded;
    next();
  });
};

// Regex estricto de validación de formato de correo electrónico
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ----------------------------------------------------------------------------
// 3. ENDPOINTS DE AUTENTICACIÓN
// ----------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en la tabla usuarios de PostgreSQL
 * Campos solicitados: nombre, apellido, correo, password
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, apellido, correo, password } = req.body;

    // 1. Validación de campos obligatorios
    if (!nombre || !apellido || !correo || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios (Nombre, Apellido, Correo y Contraseña).'
      });
    }

    const cleanNombre = String(nombre).trim();
    const cleanApellido = String(apellido).trim();
    const cleanCorreo = String(correo).trim().toLowerCase();
    const cleanPassword = String(password);

    if (cleanNombre.length < 2 || cleanApellido.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'El nombre y apellido deben contener al menos 2 caracteres.'
      });
    }

    // 2. Validación estricta de correo electrónico (con @ y dominio)
    if (!EMAIL_REGEX.test(cleanCorreo)) {
      return res.status(400).json({
        success: false,
        error: 'El formato del correo electrónico no es válido. Debe contener "@" y un dominio válido (ej: usuario@ejemplo.com).'
      });
    }

    // 3. Validación de longitud de contraseña
    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener un mínimo de 6 caracteres.'
      });
    }

    // 4. Verificar si el correo ya existe en la base de datos
    const checkResult = await pool.query(
      'SELECT id FROM usuarios WHERE correo = $1',
      [cleanCorreo]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El correo electrónico ingresado ya se encuentra registrado.'
      });
    }

    // 5. Encriptar la contraseña con bcrypt (hash seguro)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(cleanPassword, saltRounds);

    // 6. Insertar el nuevo usuario en PostgreSQL
    const insertResult = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, correo, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, apellido, correo, created_at`,
      [cleanNombre, cleanApellido, cleanCorreo, passwordHash]
    );

    const newUser = insertResult.rows[0];

    // 7. Generar token de sesión JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        correo: newUser.correo
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`[Auth] Nuevo usuario registrado exitosamente: ${newUser.correo} (ID: ${newUser.id})`);

    return res.status(201).json({
      success: true,
      message: '¡Registro completado exitosamente! Bienvenido/a a Dulces Momentos.',
      token,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        correo: newUser.correo,
        created_at: newUser.created_at
      }
    });

  } catch (error) {
    console.error('[Auth Error en Registro]:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno en el servidor al registrar el usuario.',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Autentica al usuario consultando la tabla usuarios en PostgreSQL
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, ingresá tu correo electrónico y contraseña.'
      });
    }

    const cleanCorreo = String(correo).trim().toLowerCase();
    const cleanPassword = String(password);

    if (!EMAIL_REGEX.test(cleanCorreo)) {
      return res.status(400).json({
        success: false,
        error: 'El formato de correo ingresado no es válido.'
      });
    }

    // 1. Buscar usuario por correo
    const userResult = await pool.query(
      'SELECT id, nombre, apellido, correo, password_hash, created_at FROM usuarios WHERE correo = $1',
      [cleanCorreo]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas. Correo o contraseña incorrectos.'
      });
    }

    const user = userResult.rows[0];

    // 2. Comparar contraseña con el hash encriptado
    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas. Correo o contraseña incorrectos.'
      });
    }

    // 3. Generar token de sesión JWT
    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`[Auth] Inicio de sesión exitoso: ${user.correo} (ID: ${user.id})`);

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('[Auth Error en Login]:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno en el servidor al procesar el inicio de sesión.',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Obtiene los datos del usuario actualmente autenticado mediante JWT
 */
app.get('/api/auth/me', autenticarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, apellido, correo, created_at FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[Auth Error en /me]:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al consultar datos de la sesión actual.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Cierre de sesión
 */
app.post('/api/auth/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Sesión cerrada correctamente.'
  });
});

// ----------------------------------------------------------------------------
// 4. INICIALIZACIÓN DEL SDK OFICIAL V2 DE MERCADO PAGO
// ----------------------------------------------------------------------------
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TU_ACCESS_TOKEN_AQUI';

const client = new MercadoPagoConfig({ 
  accessToken: MP_ACCESS_TOKEN 
});

// ----------------------------------------------------------------------------
// 5. ENDPOINT POST /api/crear-preferencia
// ----------------------------------------------------------------------------
app.post('/api/crear-preferencia', async (req, res) => {
  try {
    const { items, cliente } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'El carrito no contiene productos válidos.' 
      });
    }

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

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host') || `localhost:${PORT}`;
    const baseUrl = `${protocol}://${host}`;

    // Las back_urls apuntan siempre al frontend en GitHub Pages
    const frontendUrl = 'https://octima666.github.io/DulcesMomentos';

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
          success: `${frontendUrl}/?status=success`,
          failure: `${frontendUrl}/?status=failure`,
          pending: `${frontendUrl}/?status=pending`
        },
        auto_return: 'approved',
        statement_descriptor: 'Dulces Momentos',
        external_reference: `DM-${Date.now()}`
      }
    };

    const result = await preference.create(preferenceData);
    console.log(`[Mercado Pago] Preferencia creada con ID: ${result.id}`);

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
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const testRes = await pool.query('SELECT 1 as is_alive');
    if (testRes.rows[0].is_alive === 1) {
      dbStatus = 'connected';
    }
  } catch (e) {
    dbStatus = `error: ${e.message}`;
  }

  res.json({ 
    status: 'ok', 
    service: 'Dulces Momentos API',
    database: {
      type: 'PostgreSQL',
      status: dbStatus
    },
    timestamp: new Date().toISOString() 
  });
});

// ----------------------------------------------------------------------------
// 6. INICIAR SERVIDOR
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🍰 Pastelería Dulces Momentos - Servidor Backend`);
  console.log(`🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`🔐 Autenticación PostgreSQL: http://localhost:${PORT}/api/auth/login`);
  console.log(`💳 Endpoint Preferencias MP: http://localhost:${PORT}/api/crear-preferencia`);
  console.log(`======================================================\n`);
});
