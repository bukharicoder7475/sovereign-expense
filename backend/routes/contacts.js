const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const contacts = await all(`
      SELECT u.id, u.name, u.email, u.avatar, c.status
      FROM contacts c
      JOIN users u ON c.contact_id = u.id
      WHERE c.user_id = $1 AND c.status = 'accepted'
      UNION
      SELECT u.id, u.name, u.email, u.avatar, c.status
      FROM contacts c
      JOIN users u ON c.user_id = u.id
      WHERE c.contact_id = $1 AND c.status = 'accepted'
    `, [req.user.id, req.user.id]);
    res.json(contacts);
  } catch (err) {
    console.error('GET /contacts error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { contactId } = req.body;
    if (!contactId) return res.status(400).json({ error: 'Contact ID is required' });

    const existing = await get('SELECT * FROM contacts WHERE (user_id = $1 AND contact_id = $2) OR (user_id = $2 AND contact_id = $1)',
      [req.user.id, contactId]);

    if (existing) {
      if (existing.status === 'pending' && existing.user_id === contactId) {
        await run('UPDATE contacts SET status = $1 WHERE id = $2', ['accepted', existing.id]);
        return res.json({ message: 'Contact request accepted' });
      }
      return res.status(400).json({ error: 'Contact request already exists' });
    }

    await run('INSERT INTO contacts (user_id, contact_id, status) VALUES ($1, $2, $3)', [req.user.id, contactId, 'pending']);

    await run(
      'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES ($1, $2, $3, $4, $5)',
      [contactId, 'contact_request', 'Contact Request', `${req.user.name} wants to add you as a contact`, req.user.id]
    );

    res.json({ message: 'Contact request sent' });
  } catch (err) {
    console.error('POST /contacts error:', err);
    res.status(500).json({ error: 'Failed to send contact request' });
  }
});

router.get('/pending', authenticate, async (req, res) => {
  try {
    const pending = await all(`
      SELECT c.*, u.name, u.email
      FROM contacts c
      JOIN users u ON c.user_id = u.id
      WHERE c.contact_id = $1 AND c.status = 'pending'
    `, [req.user.id]);
    res.json(pending);
  } catch (err) {
    console.error('GET /contacts/pending error:', err);
    res.status(500).json({ error: 'Failed to fetch pending contacts' });
  }
});

router.delete('/:contactId', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM contacts WHERE (user_id = $1 AND contact_id = $2) OR (user_id = $2 AND contact_id = $1)',
      [req.user.id, req.params.contactId]);
    res.json({ message: 'Contact removed' });
  } catch (err) {
    console.error('DELETE /contacts/:contactId error:', err);
    res.status(500).json({ error: 'Failed to remove contact' });
  }
});

module.exports = router;
