const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

let emailTransporter = null;
function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    emailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT) || 587,
      secure: parseInt(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  }
  return emailTransporter;
}

async function sendEmailOTP(email, code) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`\n========================================`);
    console.log(`[OTP] Email verification code for ${email}: ${code}`);
    console.log(`========================================\n`);
    return { success: false, method: 'console' };
  }
  try {
    await transporter.sendMail({
      from: `"Sovereign" <${process.env.SMTP_USER || 'noreply@sovereign.app'}>`,
      to: email,
      subject: 'Your Sovereign Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; background: #000; color: #e8e8e8; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 22px; letter-spacing: 6px; color: #c0c0c0; margin: 0;">SOVEREIGN</h1>
            <p style="font-size: 11px; color: #555; margin-top: 6px; letter-spacing: 2px;">VERIFICATION CODE</p>
          </div>
          <div style="background: #111; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 13px; color: #888; margin: 0 0 12px 0;">Your verification code is</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #e0e0e0;">${code}</div>
            <p style="font-size: 11px; color: #555; margin-top: 12px;">Expires in 10 minutes</p>
          </div>
          <p style="font-size: 11px; color: #555; text-align: center;">If you didn't request this, ignore this email.</p>
        </div>
      `
    });
    return { success: true, method: 'email' };
  } catch (err) {
    console.log(`[OTP] Email send failed for ${email}: ${err.message}`);
    console.log(`[OTP] Code for ${email}: ${code}`);
    return { success: false, method: 'console' };
  }
}

function isEmail(target) {
  return target.includes('@');
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/send-otp', async (req, res) => {
  const { target, purpose } = req.body;
  if (!target || !purpose) {
    return res.status(400).json({ error: 'Target and purpose are required' });
  }
  if (!target.includes('@')) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const code = generateOTP();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await run('INSERT INTO otps (target, code, purpose, expires_at) VALUES (?, ?, ?, ?)', [target, code, purpose, expires]);

  const result = await sendEmailOTP(target, code);

  res.json({
    message: result.success ? 'OTP sent successfully' : 'OTP sent (check server console)',
    sent: result.success
  });
});

router.post('/verify-otp', async (req, res) => {
  const { target, code, purpose } = req.body;
  if (!target || !code || !purpose) {
    return res.status(400).json({ error: 'Target, code, and purpose are required' });
  }

  const otp = await get(
    'SELECT * FROM otps WHERE target = ? AND code = ? AND purpose = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1',
    [target, code, purpose, new Date().toISOString()]
  );

  if (!otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  await run('UPDATE otps SET used = 1 WHERE id = ?', [otp.id]);
  res.json({ message: 'OTP verified successfully' });
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, purpose, country_code, country, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingEmail = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (phone) {
      const existingPhone = await get('SELECT id FROM users WHERE phone = ?', [phone]);
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await run(
      'INSERT INTO users (name, email, phone, password, purpose, phone_verified, country_code, country, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, hashedPassword, purpose || '', phone ? 1 : 0, country_code || '+1', country || 'US', currency || 'USD']
    );

    const token = jwt.sign({ id: userId, name, email, phone: phone || null }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: userId, name, email, phone: phone || null, purpose: purpose || '', country_code: country_code || '+1', country: country || 'US', currency: currency || 'USD' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required' });
    }

    let user;
    if (identifier.includes('@')) {
      user = await get('SELECT * FROM users WHERE email = ?', [identifier]);
    } else {
      user = await get('SELECT * FROM users WHERE phone = ?', [identifier]);
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, purpose: user.purpose, country_code: user.country_code, country: user.country, currency: user.currency }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/check-account', async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const user = await get('SELECT id, email, name FROM users WHERE email = ?', [identifier]);

  if (!user) {
    return res.status(404).json({ error: 'No account found with that email' });
  }

  res.json({ methods: [{ type: 'email', target: user.email }], name: user.name });
});

router.post('/forgot-password', async (req, res) => {
  const { target, method } = req.body;
  if (!target) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const code = generateOTP();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await run('INSERT INTO otps (target, code, purpose, expires_at) VALUES (?, ?, ?, ?)', [target, code, 'reset_password', expires]);

  const sendResult = await sendEmailOTP(target, code);

  res.json({
    message: sendResult.success ? 'OTP sent to your email' : 'OTP sent (check server console)',
    sent: sendResult.success
  });
});

router.post('/reset-password', async (req, res) => {
  const { identifier, code, newPassword } = req.body;
  if (!identifier || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const otp = await get(
    'SELECT * FROM otps WHERE target = ? AND code = ? AND purpose = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1',
    [identifier, code, 'reset_password', new Date().toISOString()]
  );

  if (!otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  await run('UPDATE otps SET used = 1 WHERE id = ?', [otp.id]);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  if (identifier.includes('@')) {
    await run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, identifier]);
  } else {
    await run('UPDATE users SET password = ? WHERE phone = ?', [hashedPassword, identifier]);
  }

  res.json({ message: 'Password reset successfully' });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await get('SELECT id, name, email, phone, avatar, currency, purpose, phone_verified, country_code, country, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

router.put('/me', authenticate, async (req, res) => {
  const { name, email, phone, currency, country_code, country } = req.body;
  try {
    if (name) await run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    if (email) await run('UPDATE users SET email = ? WHERE id = ?', [email, req.user.id]);
    if (phone) await run('UPDATE users SET phone = ? WHERE id = ?', [phone, req.user.id]);
    if (currency) await run('UPDATE users SET currency = ? WHERE id = ?', [currency, req.user.id]);
    if (country_code) await run('UPDATE users SET country_code = ? WHERE id = ?', [country_code, req.user.id]);
    if (country) await run('UPDATE users SET country = ? WHERE id = ?', [country, req.user.id]);

    const user = await get('SELECT id, name, email, phone, avatar, currency, purpose, country_code, country FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/social-login', async (req, res) => {
  try {
    const { uid, name, email, phone, provider, photoURL, country_code, country, currency } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and email are required' });
    }

    let user = await get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      const hashedPassword = await bcrypt.hash(uid, 10);
      const userId = await run(
        'INSERT INTO users (name, email, phone, password, purpose, phone_verified, country_code, country, currency, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name || email.split('@')[0], email, phone || null, hashedPassword, 'social', 1, country_code || '+1', country || 'US', currency || 'USD', photoURL || null]
      );
      user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    } else {
      if (name && !user.name) await run('UPDATE users SET name = ? WHERE id = ?', [name, user.id]);
      if (phone && !user.phone) await run('UPDATE users SET phone = ? WHERE id = ?', [phone, user.id]);
      if (photoURL && !user.avatar) await run('UPDATE users SET avatar = ? WHERE id = ?', [photoURL, user.id]);
      user = await get('SELECT * FROM users WHERE id = ?', [user.id]);
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, purpose: user.purpose, country_code: user.country_code, country: user.country, currency: user.currency, avatar: user.avatar }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const users = await all('SELECT id, name, email, phone FROM users WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?) AND id != ? LIMIT 10', [`%${q}%`, `%${q}%`, `%${q}%`, req.user.id]);
  res.json(users);
});

module.exports = router;
