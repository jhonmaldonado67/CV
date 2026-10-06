import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

router.post('/send', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `Contacto desde MiAnime - ${name}`,
      text: message,
      html: `<p><strong>Nombre:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Mensaje:</strong><br>${message}</p>`,
    });

    res.json({ message: '✅ Correo enviado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar el correo' });
  }
});

export default router;
