/**
 * ============================================================================
 * CONEXIÓN A BASE DE DATOS POSTGRESQL (Neon Tech)
 * Archivo: db.js
 * ============================================================================
 */

require('dotenv').config();
const { Pool } = require('pg');

// Configuración de la conexión con SSL rejectUnauthorized: false para Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Eventos informativos del pool
pool.on('connect', () => {
  console.log('[PostgreSQL] Nueva conexión establecida con el pool de Neon Tech.');
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Error inesperado en el cliente del pool]:', err.message);
});

/**
 * Inicializa las tablas necesarias (incluyendo verification_codes para 2FA)
 */
async function initTables() {
  try {
    // Tabla para códigos de verificación 2FA
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Tabla de usuarios
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

    // Asegurar columna 'rol' en usuarios
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'cliente';
    `);

    // Asignar rol admin al correo principal
    await pool.query(`
      UPDATE usuarios SET rol = 'admin' WHERE LOWER(correo) = 'dulcesmomentos1112@gmail.com';
    `);

    console.log('[PostgreSQL] ✅ Tablas "verification_codes" y "usuarios" (con roles) listas en Neon.');
  } catch (err) {
    console.error('[PostgreSQL Error inicializando tablas]:', err.message);
  }
}

// Inicializar tablas al importar el módulo
initTables();

module.exports = pool;
