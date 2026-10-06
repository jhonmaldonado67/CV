import { Router } from 'express';
import Stripe from 'stripe';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = Router();

const PLANS = {
  Fan: { amount: 499, name: 'Fan' },
  'Mega Fan': { amount: 999, name: 'Mega Fan' },
};

router.get('/plans', (_req, res) => {
  res.json([
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['Catálogo básico', 'Calidad 720p', 'Anuncios'],
    },
    {
      id: 'fan',
      name: 'Fan',
      price: 4.99,
      features: ['Sin anuncios', 'Calidad 1080p', 'Acceso completo'],
    },
    {
      id: 'mega-fan',
      name: 'Mega Fan',
      price: 9.99,
      features: ['Todo lo de Fan', 'Calidad 4K', 'Descargas offline', '5 dispositivos'],
    },
  ]);
});

router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const { planName } = req.body;
    const plan = PLANS[planName];
    if (!plan) {
      return res.status(400).json({ error: 'Plan inválido' });
    }

    const userId = req.usuario.id;
    const userResult = await pool.query(
      'SELECT email, username, stripe_customer_id FROM usuarios WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = userResult.rows[0];

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: String(userId) },
      });
      customerId = customer.id;
      await pool.query(
        'UPDATE usuarios SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Plan ${plan.name}` },
          unit_amount: plan.amount,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        user_id: String(userId),
        plan_name: plan.name,
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
});

router.post('/create-portal-session', authenticate, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    const customerId = userResult.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ error: 'No tienes una suscripción activa' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/profile`,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error('Portal session error:', err);
    res.status(500).json({ error: 'Error al crear portal' });
  }
});

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = parseInt(session.metadata.user_id);
        const planName = session.metadata.plan_name;

        await pool.query(
          'UPDATE usuarios SET plan = $1 WHERE id = $2',
          [planName, userId]
        );
        console.log(`Usuario ${userId} actualizado a plan ${planName}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await pool.query(
          'UPDATE usuarios SET plan = $1 WHERE stripe_customer_id = $2',
          ['Free', customerId]
        );
        console.log(`Usuario con stripe_customer_id ${customerId} regresó a plan Free`);
        break;
      }
      case 'customer.subscription.updated':
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

export default router;
