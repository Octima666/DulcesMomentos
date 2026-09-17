/**
 * ============================================================================
 * PASTELERÍA "DULCES MOMENTOS" - SERVIDOR BACKEND (server.js)
 * Node.js + Express + PostgreSQL (Neon Tech) + Nodemailer + Mercado Pago
 * ============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Módulos locales de Base de Datos y Correo
const pool = require('./db');
const { sendVerificationCode } = require('./mailer');

// SDK Mercado Pago (opcional para pagos)
let MercadoPagoConfig, Preference;
try {
  const mp = require('mercadopago');
  MercadoPagoConfig = mp.MercadoPagoConfig;
  Preference = mp.Preference;
} catch (e) {
  console.warn('[MercadoPago] Módulo no disponible o no configurado.');
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dulces_momentos_secret_key_2026_super_secure_jwt_token!';

// ----------------------------------------------------------------------------
// 1. MIDDLEWARES
// ----------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, '.')));

// ----------------------------------------------------------------------------
// 2. ENDPOINTS SOLICITADOS (2FA con Código de 6 Dígitos)
// ----------------------------------------------------------------------------

/**
 * POST /api/login
 * Recibe email, genera un código de 6 dígitos con expiración de 10 minutos,
 * limpia registros viejos e inserta el nuevo código en la tabla verification_codes de Neon.
 * Luego envía el correo con Nodemailer y devuelve { requires2FA: true }.
 */
app.post('/api/login', async (req, res) => {
  try {
    const rawEmail = req.body.email || req.body.correo;

    if (!rawEmail) {
      return res.status(400).json({
        success: false,
        error: 'El campo de correo electrónico (email) es requerido.'
      });
    }

    const email = String(rawEmail).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'El formato de correo electrónico no es válido.'
      });
    }

    // 1. Generar código de 6 dígitos numéricos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Limpiar registros viejos (del mismo email o expirados)
    await pool.query(
      'DELETE FROM verification_codes WHERE email = $1 OR expires_at < NOW()',
      [email]
    );

    // 3. Insertar nuevo código con expiración de 10 minutos en Neon
    await pool.query(
      "INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
      [email, code]
    );

    // 5. Enviar el correo con Nodemailer (plantilla personalizada oscura y rosa)
    await sendVerificationCode(email, code);

    console.log(`[2FA Login] Código generado y enviado a: ${email}`);

    return res.status(200).json({
      requires2FA: true,
      message: 'Código de verificación enviado correctamente a tu correo.'
    });

  } catch (error) {
    console.error('[Error en POST /api/login]:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor al generar o enviar el código de verificación.',
      details: error.message
    });
  }
});

/**
 * POST /api/verify-code
 * Recibe email y code, comprueba en Neon que el código exista y no esté expirado (expires_at > NOW()).
 * Si es correcto, borra el registro usado y devuelve { success: true }.
 */
app.post('/api/verify-code', async (req, res) => {
  try {
    const rawEmail = req.body.email || req.body.correo;
    const { code } = req.body;

    if (!rawEmail || !code) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el correo electrónico y el código de verificación.'
      });
    }

    const email = String(rawEmail).trim().toLowerCase();
    const cleanCode = String(code).trim();

    // 1. Comprobar en Neon que el código exista y no esté expirado
    const query = `
      SELECT id, email, code, expires_at 
      FROM verification_codes 
      WHERE email = $1 AND code = $2 AND expires_at > NOW() 
      ORDER BY id DESC LIMIT 1
    `;
    const result = await pool.query(query, [email, cleanCode]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El código ingresado es incorrecto o ya ha expirado.'
      });
    }

    // 2. Si es correcto, borrar el registro usado
    await pool.query('DELETE FROM verification_codes WHERE email = $1', [email]);

    console.log(`[2FA Verify] ✅ Código verificado exitosamente para: ${email}`);

    return res.status(200).json({
      success: true,
      message: 'Código validado exitosamente.'
    });

  } catch (error) {
    console.error('[Error en POST /api/verify-code]:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor al validar el código.',
      details: error.message
    });
  }
});

// ----------------------------------------------------------------------------
// 3. ENDPOINTS ADICIONALES (Compatibilidad Frontend & Checkout)
// ----------------------------------------------------------------------------

// Registro de usuario tradicional
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, apellido, correo, password } = req.body;
    if (!nombre || !apellido || !correo || !password) {
      return res.status(400).json({ success: false, error: 'Todos los campos son obligatorios.' });
    }

    const cleanCorreo = String(correo).trim().toLowerCase();
    const check = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [cleanCorreo]);
    if (check.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'El correo ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const insertRes = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, correo, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, nombre, apellido, correo',
      [String(nombre).trim(), String(apellido).trim(), cleanCorreo, passwordHash]
    );

    const newUser = insertRes.rows[0];
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('[Error en /api/auth/register]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Login con contraseña tradicional
app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ success: false, error: 'Ingresá correo y contraseña.' });
    }

    const cleanCorreo = String(correo).trim().toLowerCase();
    const userRes = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [cleanCorreo]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(String(password), user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: user.id, correo: user.correo, nombre: user.nombre }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({
      success: true,
      token,
      user: { id: user.id, nombre: user.nombre, apellido: user.apellido, correo: user.correo }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Creación de preferencia de Mercado Pago
app.post('/api/crear-preferencia', async (req, res) => {
  try {
    if (!Preference || !process.env.MP_ACCESS_TOKEN) {
      return res.status(503).json({ error: 'Mercado Pago no disponible.' });
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    const { items, cliente } = req.body;
    const mpItems = (items || []).map((item, idx) => ({
      id: item.id || `item-${idx + 1}`,
      title: item.title || item.nombre || 'Producto',
      quantity: Number(item.quantity || item.cantidad || 1),
      unit_price: Number(item.unit_price || item.precio || 0),
      currency_id: 'ARS'
    }));

    const result = await preference.create({
      body: {
        items: mpItems,
        payer: { email: cliente?.email || 'cliente@dulcesmomentos.com' },
        back_urls: {
          success: 'https://octima666.github.io/DulcesMomentos/?status=success',
          failure: 'https://octima666.github.io/DulcesMomentos/?status=failure'
        },
        auto_return: 'approved'
      }
    });

    return res.json({ id: result.id, init_point: result.init_point });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint de salud
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', port: PORT });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

// ----------------------------------------------------------------------------
// 4. INICIAR SERVIDOR
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🍰 Pastelería Dulces Momentos - Backend`);
  console.log(`🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`🔑 Endpoint Login (2FA): POST http://localhost:${PORT}/api/login`);
  console.log(`🛡️ Endpoint Verify 2FA: POST http://localhost:${PORT}/api/verify-code`);
  console.log(`======================================================\n`);
});

module.exports = app;
