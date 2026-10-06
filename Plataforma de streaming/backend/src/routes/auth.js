import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import pool from '../config/db.js';

const router = Router();

const codeExpiry = 10 * 60 * 1000;
const verificationCodes = new Map();
const rateLimits = new Map();

function checkRateLimit(key, maxRequests = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimits.get(key) || { count: 0, firstAttempt: now };
  
  if (now - record.firstAttempt > windowMs) {
    rateLimits.set(key, { count: 1, firstAttempt: now });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  rateLimits.set(key, { ...record, count: record.count + 1 });
  return true;
}

function isValidUsername(username) {
  if (!username || username.length < 2 || username.length > 30) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
}

function isStrongPassword(password) {
  return password && password.length >= 3;
}

function sanitizeInput(input) {
  return input ? input.trim().slice(0, 255) : '';
}

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeVerificationCode(email, code) {
  verificationCodes.set(email, { code, expires: Date.now() + codeExpiry });
}

function verifyCode(email, code) {
  const record = verificationCodes.get(email);
  if (!record || Date.now() > record.expires) {
    verificationCodes.delete(email);
    return false;
  }
  if (record.code !== code) {
    return false;
  }
  verificationCodes.delete(email);
  return true;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function enviarCodigo(email, codigo) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"MiAnime" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Código de verificación — MiAnime',
    text: `Tu código de verificación es: ${codigo}`,
    html: `
      <div style="background:#07070f; padding:2rem; font-family:sans-serif;">
        <div style="max-width:400px; margin:0 auto; background:#111122; border-radius:14px; padding:2rem; border:1px solid rgba(255,255,255,0.06);">
          <h1 style="font-family:sans-serif; color:#f97316; font-size:1.5rem; margin:0 0 0.5rem;">Mi<span style="color:#f1f0ff;">Anime</span></h1>
          <p style="color:#9896b8; font-size:0.9rem;">Usa este código para verificar tu cuenta:</p>
          <div style="background:#181830; border-radius:10px; padding:1rem; text-align:center; margin:1.5rem 0;">
            <span style="font-size:2rem; letter-spacing:0.3em; font-weight:700; color:#f97316;">${codigo}</span>
          </div>
          <p style="color:#4d4b72; font-size:0.8rem;">Este código expira en 10 minutos.</p>
        </div>
      </div>
    `,
  });
}

router.post('/register', async (req, res) => {
  try {
    const { username: rawUsername, email: rawEmail, password: rawPassword, avatar, rango, intereses } = req.body;

    const username = sanitizeInput(rawUsername);
    const email = (sanitizeInput(rawEmail) || `${username.toLowerCase()}@streammax.local`).toLowerCase();
    const password = rawPassword;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    if (!checkRateLimit(`register:${email}`, 3, 30 * 60 * 1000)) {
      return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 30 minutos.' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({ 
        error: 'Usuario inválido. Usa 2-30 caracteres alfanuméricos o guiones bajos.' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Correo electrónico inválido' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 3 caracteres.' 
      });
    }

    const existente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: 'El usuario o email ya existe' });
    }

    const hash = await bcrypt.hash(password, 12);
    const codigo = generarCodigo();
    
    await pool.query(
      `INSERT INTO usuarios (username, email, password, verificado, avatar, rango, intereses)
       VALUES ($1, $2, $3, TRUE, $4, $5, $6)`,
      [username, email, hash, avatar || 'avatar-cyber', rango || 'VIP Pionero', intereses || []]
    );

    // Auto-login since they are verified instantly
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    const usuario = result.rows[0];
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Cuenta creada y verificada exitosamente',
      usuario: { id: usuario.id, username: usuario.username, email: usuario.email, plan: usuario.plan },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { email: rawEmail, code } = req.body;
    const email = sanitizeInput(rawEmail)?.toLowerCase();

    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código requeridos' });
    }

    if (!checkRateLimit(`verify:${email}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND verification_code = $2',
      [email, code]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    await pool.query(
      'UPDATE usuarios SET verificado = TRUE, verification_code = NULL WHERE email = $1',
      [email]
    );

    const usuario = result.rows[0];
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      message: 'Cuenta verificada exitosamente',
      usuario: { id: usuario.id, username: usuario.username, email: usuario.email, plan: usuario.plan },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar' });
  }
});

router.post('/resend-code', async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    const email = sanitizeInput(rawEmail)?.toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    if (!checkRateLimit(`resend:${email}`, 3, 30 * 60 * 1000)) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta de nuevo en 30 minutos.' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) AND verificado = FALSE',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No hay cuenta pendiente de verificación con ese email' });
    }

    const codigo = generarCodigo();
    await pool.query(
      'UPDATE usuarios SET verification_code = $1 WHERE email = $2',
      [codigo, email]
    );

    storeVerificationCode(email, codigo);
    await enviarCodigo(email, codigo).catch(console.error);

    res.json({ message: 'Código reenviado a tu correo' });
  } catch (err) {
    res.status(500).json({ error: 'Error al reenviar código' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const identifier = sanitizeInput(rawEmail)?.toLowerCase(); // Can be username or email
    const passwordInput = password;

    if (!identifier || !passwordInput) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    if (!checkRateLimit(`login:${identifier}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(email) = $1 OR LOWER(username) = $1',
      [identifier]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const usuario = result.rows[0];
    const valido = await bcrypt.compare(passwordInput, usuario.password);
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    if (!usuario.verificado) {
      return res.status(403).json({
        error: 'Cuenta no verificada',
        code: 'UNVERIFIED',
        email: usuario.email,
      });
    }
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      usuario: { id: usuario.id, username: usuario.username, email: usuario.email, plan: usuario.plan },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, username, email, plan, verificado, created_at FROM usuarios WHERE id = $1',
      [decoded.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

router.post('/upgrade-plan', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const { plan } = req.body;
    
    await pool.query('UPDATE usuarios SET plan = $1 WHERE id = $2', [plan, decoded.id]);
    res.json({ success: true, plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando plan' });
  }
});

export default router;
