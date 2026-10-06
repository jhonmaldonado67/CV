import pool from './db.js';

async function seed() {
  try {
    console.log('Borrando animes actuales...');
    await pool.query('DELETE FROM animes');
    
    console.log('Asegurando columna is_anime...');
    await pool.query(`ALTER TABLE animes ADD COLUMN IF NOT EXISTS is_anime BOOLEAN DEFAULT TRUE;`);
    const animes = [
      // ANIME
      ['One Piece', '{acción,aventura,shonen}', 1.2, 1089, 'T20', 'Serie', 'one-piece.jpeg', '🔥 Hot', '#7c3aed', true],
      ['Jujutsu Kaisen', '{acción,fantasía,shonen}', 9.0, 23, 'T2', 'Serie', 'jujutsu-kaisen.jpg', 'Nuevo', '#f97316', true],
      ['Demon Slayer', '{acción,fantasía,shonen}', 8.9, 11, 'T3', 'Serie', 'demon.jpg', 'SUB', 'transparent', true],
      ['Attack on Titan', '{acción,thriller,seinen}', 9.8, 28, 'T4', 'Serie', 'snk.jpg', '🔥 Hot', '#7c3aed', true],
      ['My Hero Academia', '{acción,aventura,shonen}', 8.4, 12, 'T7', 'Serie', 'my-hero-academi.jpg', 'Nuevo', '#f97316', true],
      ['Death Note', '{thriller,seinen}', 9.5, 37, 'T1', 'Serie', 'dn.jpg', 'SUB', 'transparent', true],
      ['Fullmetal Alchemist', '{fantasía,aventura,shonen}', 9.7, 64, 'T1', 'Serie', 'fma.jpg', '🔥 Hot', '#7c3aed', true],
      ['A Silent Voice', '{romance,comedia}', 9.1, 1, '2016', 'Película', 'koe.jpg', 'Film', '#f97316', true],
      ['Chainsaw Man: Davi Arc', '{acción,fantasía oscura,shonen}', 9.3, 1, '2024', 'Película', 'chainsawe-man-Davi-arc.jpg', 'Nuevo', '#ef4444', true],
      
      // STREAMING (occidental)
      ['Breaking Bad', '{drama,thriller,crimen}', 9.9, 62, 'T5', 'Serie', 'breaking-bad.jpg', '🔥 Hot', '#1a6cff', false],
      ['Game of Thrones', '{fantasía,drama,acción}', 9.2, 73, 'T8', 'Serie', 'game-of-thrones.jpg', 'Épico', '#1a6cff', false],
      ['Stranger Things', '{sci-fi,drama,misterio}', 8.7, 34, 'T4', 'Serie', 'streenger-stings.jpg', 'Top 10', '#1a6cff', false],
      ['The Dark Knight', '{acción,crimen,drama}', 9.0, 1, '2008', 'Película', 'the-dark-knight.jpg', 'Film', 'transparent', false],
      ['Interstellar', '{sci-fi,drama,aventura}', 8.6, 1, '2014', 'Película', 'interestelar.jpg', 'Film', 'transparent', false],
      ['The Office', '{comedia}', 8.9, 201, 'T9', 'Serie', 'the-office.jpg', 'Comedia', 'transparent', false],
      ['Dune: Part Two', '{sci-fi,aventura,acción}', 8.8, 1, '2024', 'Película', 'dune-part-two.jpg', 'Nuevo', '#1a6cff', false],
      ['Ovnis en Zacapa', '{comedia,sci-fi,aventura}', 8.5, 1, '2015', 'Película', 'ovniz_en_zacapa.jpg', 'Original', '#ef4444', false],
      ['Puro Mula', '{comedia}', 8.0, 1, '2011', 'Película', 'puro_mula.jpg', 'Original', '#ef4444', false],
    ];
    
    console.log('Insertando nuevos datos...');
    for (const a of animes) {
      await pool.query(
        `INSERT INTO animes (titulo, generos, rating, episodios, temporada, tipo, imagen, badge, badge_color, is_anime)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        a
      );
    }
    console.log('¡Base de datos sembrada correctamente!');
  } catch (error) {
    console.error('Error sembrando:', error);
  } finally {
    process.exit();
  }
}

seed();
