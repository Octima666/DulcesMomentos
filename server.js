/**
 * ============================================================================
 * PASTELERÍA "DULCES MOMENTOS" - SERVIDOR BACKEND (server.js)
 * Node.js + Express + SQL Server (MSSQLLocalDB) + Mercado Pago SDK v2 Official
 * ============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql/msnodesqlv8');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Seguridad y Base de Datos
const JWT_SECRET = process.env.JWT_SECRET || 'dulces_momentos_secret_key_2026_super_secure_jwt_token!';
const DB_SERVER = process.env.DB_SERVER || '(localdb)\\MSSQLLocalDB';
const DB_NAME = process.env.DB_NAME || 'DulcesMomentos';
const DB_DRIVER = process.env.DB_DRIVER || 'ODBC Driver 18 for SQL Server';

const dbConnectionString = `Server=${DB_SERVER};Database=${DB_NAME};Trusted_Connection=Yes;Driver={${DB_DRIVER}};TrustServerCertificate=Yes;`;

// ----------------------------------------------------------------------------
// 1. MIDDLEWARES
// ----------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '.')));

// ----------------------------------------------------------------------------
// 2. CONEXIÓN A BASE DE DATOS SQL SERVER
// ----------------------------------------------------------------------------
let dbPool = null;

async function getDbPool() {
  if (!dbPool || !dbPool.connected) {
    try {
      console.log(`[SQL Server] Conectando a ${DB_SERVER} / Base: ${DB_NAME}...`);
      dbPool = await new sql.ConnectionPool({
        connectionString: dbConnectionString
      }).connect();
      console.log(`[SQL Server] ✅ Conexión establecida exitosamente con ${DB_NAME}.`);
      
      // Asegurar que la tabla Usuarios exista
      await initDatabase();
    } catch (err) {
      console.error('[SQL Server Error] Error al conectar a la base de datos:', err.message);
      throw err;
    }
  }
  return dbPool;
}

async function initDatabase() {
  try {
    const checkTableQuery = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
      BEGIN
        CREATE TABLE Usuarios (
          id INT IDENTITY(1,1) PRIMARY KEY,
          nombre NVARCHAR(50) NOT NULL,
          apellido NVARCHAR(50) NOT NULL,
          correo NVARCHAR(100) NOT NULL UNIQUE,
          password_hash NVARCHAR(255) NOT NULL,
          created_at DATETIME2 DEFAULT SYSDATETIME()
        );
        PRINT 'Tabla Usuarios creada exitosamente.';
      END
    `;
    const request = dbPool.request();
    await request.query(checkTableQuery);
  } catch (error) {
    console.error('[SQL Server Error] Error al verificar/crear tabla Usuarios:', error.message);
  }
}

// Inicializar conexión inmediatamente
getDbPool().catch(err => {
  console.warn('[SQL Server] Advertencia: La conexión inicial falló, se reintentará en cada solicitud:', err.message);
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
 * Registra un nuevo usuario en la tabla Usuarios de SQL Server
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

    const pool = await getDbPool();

    // 4. Verificar si el correo ya existe en la base de datos
    const checkQuery = `SELECT id FROM Usuarios WHERE correo = @correo`;
    const checkResult = await pool.request()
      .input('correo', sql.NVarChar(100), cleanCorreo)
      .query(checkQuery);

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El correo electrónico ingresado ya se encuentra registrado.'
      });
    }

    // 5. Encriptar la contraseña con bcrypt (hash seguro)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(cleanPassword, saltRounds);

    // 6. Insertar el nuevo usuario en SQL Server
    const insertQuery = `
      INSERT INTO Usuarios (nombre, apellido, correo, password_hash)
      OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.apellido, INSERTED.correo, INSERTED.created_at
      VALUES (@nombre, @apellido, @correo, @password_hash);
    `;

    const insertResult = await pool.request()
      .input('nombre', sql.NVarChar(50), cleanNombre)
      .input('apellido', sql.NVarChar(50), cleanApellido)
      .input('correo', sql.NVarChar(100), cleanCorreo)
      .input('password_hash', sql.NVarChar(255), passwordHash)
      .query(insertQuery);

    const newUser = insertResult.recordset[0];

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
 * Autentica al usuario consultando la tabla Usuarios en SQL Server
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

    const pool = await getDbPool();

    // 1. Buscar usuario por correo
    const userQuery = `
      SELECT id, nombre, apellido, correo, password_hash, created_at 
      FROM Usuarios 
      WHERE correo = @correo
    `;

    const userResult = await pool.request()
      .input('correo', sql.NVarChar(100), cleanCorreo)
      .query(userQuery);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas. Correo o contraseña incorrectos.'
      });
    }

    const user = userResult.recordset[0];

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
    const pool = await getDbPool();
    const query = `
      SELECT id, nombre, apellido, correo, created_at 
      FROM Usuarios 
      WHERE id = @id
    `;
    const result = await pool.request()
      .input('id', sql.Int, req.usuario.id)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      user: result.recordset[0]
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

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || `localhost:${PORT}`;
    const baseUrl = `${protocol}://${host}`;

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
    const pool = await getDbPool();
    const testRes = await pool.request().query('SELECT 1 as is_alive');
    if (testRes.recordset[0].is_alive === 1) {
      dbStatus = 'connected';
    }
  } catch (e) {
    dbStatus = `error: ${e.message}`;
  }

  res.json({ 
    status: 'ok', 
    service: 'Dulces Momentos API',
    database: {
      server: DB_SERVER,
      name: DB_NAME,
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
  console.log(`🔐 Autenticación SQL Server: http://localhost:${PORT}/api/auth/login`);
  console.log(`💳 Endpoint Preferencias MP: http://localhost:${PORT}/api/crear-preferencia`);
  console.log(`======================================================\n`);
});
