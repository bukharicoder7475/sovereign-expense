const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/:groupId', authenticate, async (req, res) => {
  const { limit = 50, before } = req.query;

  const membership = await get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [req.params.groupId, req.user.id]);
  if (!membership) return res.status(403).json({ error: 'Not a member' });

  let whereClause = 'WHERE m.group_id = ?';
  const params = [req.params.groupId];

  if (before) {
    whereClause += ' AND m.id < ?';
    params.push(before);
  }

  params.push(parseInt(limit));

  const messages = await all(`
    SELECT m.*, u.name, u.avatar
    FROM messages m
    JOIN users u ON m.user_id = u.id
    ${whereClause}
    ORDER BY m.created_at DESC
    LIMIT ?
  `, params);

  res.json(messages.reverse());
});

router.post('/:groupId', authenticate, async (req, res) => {
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Message content is required' });

  const membership = await get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [req.params.groupId, req.user.id]);
  if (!membership) return res.status(403).json({ error: 'Not a member' });

  const messageId = await run('INSERT INTO messages (group_id, user_id, content) VALUES (?, ?, ?)', [req.params.groupId, req.user.id, content]);

  const message = await get(`
    SELECT m.*, u.name, u.avatar
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `, [messageId]);

  const io = req.app.get('io');
  if (io) {
    io.to(`group_${req.params.groupId}`).emit('new_message', message);
  }

  res.status(201).json(message);
});

module.exports = router;
