const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const notifications = await all(`
    SELECT * FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `, [req.user.id]);

  const unreadCount = await get('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id]);

  res.json({ notifications, unread_count: unreadCount ? unreadCount.count : 0 });
});

router.put('/:id/read', authenticate, async (req, res) => {
  await run('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ message: 'Marked as read' });
});

router.put('/read-all', authenticate, async (req, res) => {
  await run('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
  res.json({ message: 'All marked as read' });
});

router.delete('/:id', authenticate, async (req, res) => {
  await run('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ message: 'Notification deleted' });
});

module.exports = router;
