const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const contacts = await all(`
    SELECT u.id, u.name, u.email, u.avatar, c.status
    FROM contacts c
    JOIN users u ON c.contact_id = u.id
    WHERE c.user_id = ? AND c.status = 'accepted'
    UNION
    SELECT u.id, u.name, u.email, u.avatar, c.status
    FROM contacts c
    JOIN users u ON c.user_id = u.id
    WHERE c.contact_id = ? AND c.status = 'accepted'
  `, [req.user.id, req.user.id]);

  res.json(contacts);
});

router.post('/', authenticate, async (req, res) => {
  const { contactId } = req.body;

  if (!contactId) return res.status(400).json({ error: 'Contact ID is required' });

  const existing = await get('SELECT * FROM contacts WHERE (user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?)',
    [req.user.id, contactId, contactId, req.user.id]);

  if (existing) {
    if (existing.status === 'pending' && existing.user_id === contactId) {
      await run('UPDATE contacts SET status = ? WHERE id = ?', ['accepted', existing.id]);
      return res.json({ message: 'Contact request accepted' });
    }
    return res.status(400).json({ error: 'Contact request already exists' });
  }

  await run('INSERT INTO contacts (user_id, contact_id, status) VALUES (?, ?, ?)', [req.user.id, contactId, 'pending']);

  await run(
    'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
    [contactId, 'contact_request', 'Contact Request', `${req.user.name} wants to add you as a contact`, req.user.id]
  );

  res.json({ message: 'Contact request sent' });
});

router.delete('/:contactId', authenticate, async (req, res) => {
  await run('DELETE FROM contacts WHERE (user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?)',
    [req.user.id, req.params.contactId, req.params.contactId, req.user.id]);
  res.json({ message: 'Contact removed' });
});

router.get('/pending', authenticate, async (req, res) => {
  const pending = await all(`
    SELECT c.*, u.name, u.email
    FROM contacts c
    JOIN users u ON c.user_id = u.id
    WHERE c.contact_id = ? AND c.status = 'pending'
  `, [req.user.id]);

  res.json(pending);
});

module.exports = router;
