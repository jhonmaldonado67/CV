import { Router } from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET todos los animes
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM animes ORDER BY rating DESC');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener animes' });
  }
});

// GET aleatorio
router.get('/random', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id FROM animes ORDER BY RANDOM() LIMIT 1');
    if (result.rows.length === 0) return res.status(404).json({ error: 'No hay animes' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener anime aleatorio' });
  }
});

// GET por genero (debe ir ANTES de /:id)
router.get('/genero/:genero', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM animes WHERE $1 = ANY(generos) ORDER BY rating DESC',
      [req.params.genero]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Error al filtrar animes' });
  }
});

// GET continuar viendo (debe ir ANTES de /:id)
router.get('/continue', authenticate, async (req, res) => {
  try {
    const userId = req.usuario.id;
    const result = await pool.query(
      `SELECT cv.id, cv.episodio, cv.progreso, cv.updated_at, 
              a.id as anime_id, a.titulo, a.temporada, a.tipo, a.imagen, a.episodios as total_episodios
       FROM continuar_viendo cv
       JOIN animes a ON a.id = cv.anime_id
       WHERE cv.usuario_id = $1
       ORDER BY cv.updated_at DESC
       LIMIT 10`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener progreso' });
  }
});

// GET por id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM animes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anime no encontrado' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al obtener anime' });
  }
});

// PATCH actualizar campos de un anime
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
    const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...keys.map(k => fields[k])];
    await pool.query(`UPDATE animes SET ${setClauses} WHERE id = $1`, values);
    res.json({ message: '✅ Actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// POST seed data
router.post('/seed', async (_req, res) => {
  try {
    await pool.query('DELETE FROM animes');
    const animes = [
      // ANIME
      ['One Piece', '{acción,aventura,shonen}', 1.2, 1089, 'T20', 'Serie', 'onep.jpg', '🔥 Hot', '#7c3aed', true],
      ['Jujutsu Kaisen', '{acción,fantasía,shonen}', 9.0, 23, 'T2', 'Serie', 'juju.jpg', 'Nuevo', '#f97316', true],
      ['Demon Slayer', '{acción,fantasía,shonen}', 8.9, 11, 'T3', 'Serie', 'demon.jpg', 'SUB', 'transparent', true],
      ['Attack on Titan', '{acción,thriller,seinen}', 9.8, 28, 'T4', 'Serie', 'snk.jpg', '🔥 Hot', '#7c3aed', true],
      ['My Hero Academia', '{acción,aventura,shonen}', 8.4, 12, 'T7', 'Serie', 'bnha.jpg', 'Nuevo', '#f97316', true],
      ['Death Note', '{thriller,seinen}', 9.5, 37, 'T1', 'Serie', 'dn.jpg', 'SUB', 'transparent', true],
      ['Fullmetal Alchemist', '{fantasía,aventura,shonen}', 9.7, 64, 'T1', 'Serie', 'fma.jpg', '🔥 Hot', '#7c3aed', true],
      ['A Silent Voice', '{romance,comedia}', 9.1, 1, '2016', 'Película', 'koe.jpg', 'Film', '#f97316', true],
      
      // STREAMING (occidental)
      ['Breaking Bad', '{drama,thriller,crimen}', 9.9, 62, 'T5', 'Serie', 'bb.jpg', '🔥 Hot', '#1a6cff', false],
      ['Game of Thrones', '{fantasía,drama,acción}', 9.2, 73, 'T8', 'Serie', 'got.jpg', 'Épico', '#1a6cff', false],
      ['Stranger Things', '{sci-fi,drama,misterio}', 8.7, 34, 'T4', 'Serie', 'st.jpg', 'Top 10', '#1a6cff', false],
      ['The Dark Knight', '{acción,crimen,drama}', 9.0, 1, '2008', 'Película', 'dk.jpg', 'Film', 'transparent', false],
      ['Interstellar', '{sci-fi,drama,aventura}', 8.6, 1, '2014', 'Película', 'inter.jpg', 'Film', 'transparent', false],
      ['The Office', '{comedia}', 8.9, 201, 'T9', 'Serie', 'office.jpg', 'Comedia', 'transparent', false],
      ['Dune: Part Two', '{sci-fi,aventura,acción}', 8.8, 1, '2024', 'Película', 'dune2.jpg', 'Nuevo', '#1a6cff', false],
    ];
    for (const a of animes) {
      await pool.query(
        `INSERT INTO animes (titulo, generos, rating, episodios, temporada, tipo, imagen, badge, badge_color, is_anime)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        a
      );
    }
    res.json({ message: '✅ Media seed insertados (Anime + Streaming)' });
  } catch (err) {
    res.status(500).json({ error: 'Error al insertar seed' });
  }
});

// POST insertar una sola película/anime
router.post('/insert', async (req, res) => {
  try {
    const { titulo, generos, rating, episodios, temporada, tipo, imagen, badge, badge_color, is_anime, video_local, descripcion } = req.body;
    await pool.query(`ALTER TABLE animes ADD COLUMN IF NOT EXISTS video_local TEXT`);
    const result = await pool.query(
      `INSERT INTO animes (titulo, generos, rating, episodios, temporada, tipo, imagen, badge, badge_color, is_anime, video_local, descripcion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [titulo, generos, rating, episodios, temporada, tipo, imagen, badge, badge_color, is_anime, video_local || null, descripcion || null]
    );
    res.json({ message: '✅ Insertado', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al insertar' });
  }
});

// POST guardar progreso
router.post('/continue', authenticate, async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { animeId, episodio, progreso } = req.body;

    if (!animeId || episodio === undefined) {
      return res.status(400).json({ error: 'animeId y episodio requeridos' });
    }

    await pool.query(
      `INSERT INTO continuar_viendo (usuario_id, anime_id, episodio, progreso, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (usuario_id, anime_id)
       DO UPDATE SET episodio = $3, progreso = $4, updated_at = NOW()`,
      [userId, animeId, episodio, progreso || 0]
    );
    res.json({ message: 'Progreso guardado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar progreso' });
  }
});

// DELETE eliminar de continuar viendo
router.delete('/continue/:animeId', authenticate, async (req, res) => {
  try {
    const userId = req.usuario.id;
    await pool.query(
      'DELETE FROM continuar_viendo WHERE usuario_id = $1 AND anime_id = $2',
      [userId, req.params.animeId]
    );
    res.json({ message: 'Eliminado de continuar viendo' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

export default router;
