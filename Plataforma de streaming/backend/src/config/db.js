import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        plan VARCHAR(20) DEFAULT 'Free',
        verificado BOOLEAN DEFAULT FALSE,
        verification_code VARCHAR(6),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Add columns if upgrading existing table
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT FALSE;`);
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);`);
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);`);
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar VARCHAR(100) DEFAULT 'avatar-cyber';`);
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rango VARCHAR(50) DEFAULT 'VIP Pionero';`);
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intereses TEXT[] DEFAULT '{}';`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS animes (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        generos TEXT[] NOT NULL,
        rating DECIMAL(3,1) DEFAULT 0,
        episodios INT DEFAULT 0,
        temporada VARCHAR(50),
        tipo VARCHAR(20) DEFAULT 'Serie',
        imagen VARCHAR(500),
        badge VARCHAR(20),
        badge_color VARCHAR(50),
        descripcion TEXT,
        is_anime BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE animes ADD COLUMN IF NOT EXISTS is_anime BOOLEAN DEFAULT TRUE;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS continuar_viendo (
        id SERIAL PRIMARY KEY,
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        anime_id INT REFERENCES animes(id) ON DELETE CASCADE,
        episodio INT DEFAULT 1,
        progreso INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT usuario_anime_unique UNIQUE (usuario_id, anime_id)
      );
    `);
    console.log('✅ Base de datos inicializada');
  } finally {
    client.release();
  }
}

export default pool;
