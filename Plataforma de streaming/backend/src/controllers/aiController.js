import { GoogleGenAI } from '@google/genai';
import pool from '../config/db.js';

// Inicializar cliente (usará process.env.GEMINI_API_KEY automáticamente si está definido)
let ai;
try {
  ai = new GoogleGenAI({});
} catch (error) {
  console.log("No GEMINI_API_KEY found, AI endpoints will return mock data or error.");
}

// Función auxiliar para obtener el catálogo completo de la BD
const getCatalog = async () => {
  try {
    const { rows } = await pool.query('SELECT id, titulo, generos, tipo, is_anime FROM animes');
    return rows.map(r => `ID: ${r.id}, Título: "${r.titulo}", Géneros: ${r.generos}, Tipo: ${r.tipo}, Es Anime: ${r.is_anime}`).join('\n');
  } catch (error) {
    return 'Catálogo no disponible.';
  }
};

export const chatAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!ai) {
      return res.json({ response: "La Inteligencia Artificial está descansando. ¡Añade la API Key en el backend para despertarla!" });
    }

    const catalog = await getCatalog();
    const prompt = `Eres el asistente virtual experto de la plataforma de streaming STREAMMAX. 
El usuario te dice: "${message}"

Responde de manera amigable, útil y concisa (máximo 3 párrafos). 
Aquí está el catálogo de películas, series y anime disponible en nuestra base de datos:
${catalog}

Además, en nuestra nueva sección de Música, STREAMMAX cuenta de manera exclusiva con los siguientes artistas y canciones:
- The Weeknd: Blinding Lights, Starboy, Save Your Tears.
- Bad Bunny: Me Porto Bonito, Tití Me Preguntó, Dákiti.
- Wave to Earth: seasons, light, bad.
- Farruko Pop: Soltero Feliz, Tengo a mi madre.
- Jose Jose: El Triste, Almohada.
- Luis Miguel: La Incondicional, Ahora Te Puedes Marchar.
- Kenshi Yonezu: Kick Back, Lemon.

Si te preguntan por música, puedes recomendar a estos artistas y mencionar que pueden escucharlos en la sección "Música" de la app.`;

    const result = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });

    res.json({ response: result.text });
  } catch (error) {
    if (error.status === 429) {
      const chatMocks = [
        "¡Claro! Te recomendaría ver algo de Ciencia Ficción hoy, quizás 'Interestelar' o 'Matrix'.",
        "Basado en tu gusto, creo que 'Neon Genesis Evangelion' o 'Akira' te encantarán. ¡Están geniales!",
        "Siempre es un buen momento para una comedia ligera. ¡Revisa la sección de recomendados!",
        "¡Por supuesto! Si tienes ganas de música, te recomiendo muchísimo escuchar a The Weeknd o a Wave to Earth en nuestra sección de Música. ¡Están en tendencia!"
      ];
      return res.json({ response: chatMocks[Math.floor(Math.random() * chatMocks.length)] });
    }
    console.error('Error en chatAssistant:', error);
    res.status(500).json({ error: 'Error al generar respuesta de IA' });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    // Para ahorrar consultas a la API de Gemini (15/min), el carrusel usará aleatoriedad pura.
    const { rows } = await pool.query('SELECT * FROM animes ORDER BY RANDOM() LIMIT 3');
    res.json({ recommendations: rows });
  } catch (error) {
    console.error('Error en getRecommendations:', error);
    res.status(500).json({ error: 'Error al generar recomendaciones' });
  }
};

export const getTrivia = async (req, res) => {
  try {
    const { titulo } = req.body;
    
    if (!ai) {
      return res.json({ trivia: "Trivia desactivada. Añade la API Key de Gemini." });
    }

    const prompt = `Dime un dato curioso interesante y corto (sin spoilers) sobre la película/serie/anime: "${titulo}". Escribe un solo párrafo atractivo.`;

    const result = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });

    res.json({ trivia: result.text.trim() });
  } catch (error) {
    if (error.status === 429) {
      const triviaMocks = [
        "¿Sabías que esta producción tomó más de 3 años de planificación? El equipo durmió en los estudios durante semanas.",
        "Un dato curioso: El creador se inspiró en un viaje a Europa y una pesadilla de su infancia para la historia.",
        "¡El diseño de los personajes cambió 4 veces antes del resultado final que ves en pantalla!"
      ];
      return res.json({ trivia: triviaMocks[Math.floor(Math.random() * triviaMocks.length)] });
    }
    console.error('Error en getTrivia:', error);
    res.status(500).json({ error: 'Error al generar trivia' });
  }
};
