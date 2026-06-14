const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await all(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.id]);

    const unreadCount = await get('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0', [req.user.id]);

    res.json({ notifications, unread_count: unreadCount ? unreadCount.count : 0 });
  } catch (err) {
    console.error('GET /notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('PUT /notifications/:id/read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.put('/read-all', authenticate, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error('PUT /notifications/read-all error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('DELETE /notifications/:id error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
