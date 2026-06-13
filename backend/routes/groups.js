const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const groups = await all(`
    SELECT g.*, gm.role,
      (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `, [req.user.id]);
  res.json(groups);
});

router.post('/', authenticate, async (req, res) => {
  const { name, description, memberIds } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const groupId = await run('INSERT INTO groups (name, description, creator_id) VALUES (?, ?, ?)', [name, description || '', req.user.id]);

  await run('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)', [groupId, req.user.id, 'admin']);

  if (memberIds && memberIds.length > 0) {
    for (const memberId of memberIds) {
      try {
        await run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [groupId, memberId]);
      } catch (e) { /* ignore duplicates */ }
    }
  }

  const group = await get('SELECT * FROM groups WHERE id = ?', [groupId]);
  res.status(201).json(group);
});

router.get('/:id', authenticate, async (req, res) => {
  const group = await get('SELECT * FROM groups WHERE id = ?', [req.params.id]);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const membership = await get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group.id, req.user.id]);
  if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

  const members = await all(`
    SELECT u.id, u.name, u.email, u.avatar, gm.role
    FROM users u
    JOIN group_members gm ON u.id = gm.user_id
    WHERE gm.group_id = ?
  `, [group.id]);

  res.json({ ...group, members });
});

router.put('/:id', authenticate, async (req, res) => {
  const { name, description } = req.body;
  const group = await get('SELECT * FROM groups WHERE id = ?', [req.params.id]);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  if (group.creator_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the creator can update the group' });
  }

  await run('UPDATE groups SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
    [name, description, req.params.id]);

  const updated = await get('SELECT * FROM groups WHERE id = ?', [req.params.id]);
  res.json(updated);
});

router.delete('/:id', authenticate, async (req, res) => {
  const group = await get('SELECT * FROM groups WHERE id = ?', [req.params.id]);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.creator_id !== req.user.id) return res.status(403).json({ error: 'Only the creator can delete the group' });

  await run('DELETE FROM groups WHERE id = ?', [req.params.id]);
  res.json({ message: 'Group deleted' });
});

router.post('/:id/members', authenticate, async (req, res) => {
  const { userId } = req.body;
  const group = await get('SELECT * FROM groups WHERE id = ?', [req.params.id]);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  try {
    await run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [req.params.id, userId]);
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(400).json({ error: 'User already in group or invalid user' });
  }
});

router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  const group = await get('SELECT * FROM groups WHERE id = ?', [req.params.id]);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  await run('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  res.json({ message: 'Member removed' });
});

router.get('/:id/balances', authenticate, async (req, res) => {
  const expenses = await all('SELECT * FROM expenses WHERE group_id = ?', [req.params.id]);

  const balances = {};

  for (const expense of expenses) {
    const splits = await all('SELECT * FROM expense_splits WHERE expense_id = ?', [expense.id]);

    if (!balances[expense.paid_by]) balances[expense.paid_by] = 0;

    for (const split of splits) {
      if (split.user_id === expense.paid_by) continue;

      if (!balances[split.user_id]) balances[split.user_id] = 0;

      if (!split.is_settled) {
        balances[expense.paid_by] += split.amount;
        balances[split.user_id] -= split.amount;
      }
    }
  }

  const members = await all(`
    SELECT u.id, u.name
    FROM users u
    JOIN group_members gm ON u.id = gm.user_id
    WHERE gm.group_id = ?
  `, [req.params.id]);

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m.name; });

  const result = Object.entries(balances).map(([userId, balance]) => ({
    userId: parseInt(userId),
    name: memberMap[parseInt(userId)] || 'Unknown',
    balance: Math.round(balance * 100) / 100
  }));

  res.json(result);
});

module.exports = router;
