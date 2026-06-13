const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { group_id, category, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = `
    WHERE (e.paid_by = ? OR e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = ?))
  `;
  const params = [req.user.id, req.user.id];

  if (group_id) {
    whereClause += ' AND e.group_id = ?';
    params.push(group_id);
  }
  if (category) {
    whereClause += ' AND e.category = ?';
    params.push(category);
  }

  const expenses = await all(`
    SELECT e.*, u.name as paid_by_name, g.name as group_name,
      (SELECT COUNT(*) FROM expense_splits WHERE expense_id = e.id) as split_count
    FROM expenses e
    JOIN users u ON e.paid_by = u.id
    LEFT JOIN groups g ON e.group_id = g.id
    ${whereClause}
    ORDER BY e.date DESC
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), parseInt(offset)]);

  const totalResult = await get(`
    SELECT COUNT(*) as count
    FROM expenses e
    ${whereClause}
  `, params);

  res.json({ expenses, total: totalResult ? totalResult.count : 0, page: parseInt(page), limit: parseInt(limit) });
});

router.post('/', authenticate, async (req, res) => {
  const { group_id, description, amount, category, split_type, splits, date } = req.body;

  if (!group_id) {
    return res.status(400).json({ error: 'Group is required. Please select or create a group first.' });
  }

  if (!description || !amount) {
    return res.status(400).json({ error: 'Description and amount are required' });
  }

  const group = await get('SELECT id FROM groups WHERE id = ?', [group_id]);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const expenseId = await run(
    'INSERT INTO expenses (group_id, paid_by, description, amount, category, split_type, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [group_id, req.user.id, description, amount, category || 'General', split_type || 'equal', date || new Date().toISOString()]
  );

  if (splits && splits.length > 0) {
    for (const split of splits) {
      await run('INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)', [expenseId, split.user_id, split.amount]);
    }
  } else {
    const members = await all('SELECT user_id FROM group_members WHERE group_id = ?', [group_id]);
    const perPerson = amount / members.length;
    for (const member of members) {
      await run('INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)', [expenseId, member.user_id, Math.round(perPerson * 100) / 100]);
    }
  }

  const members = await all('SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ?', [group_id, req.user.id]);
  for (const member of members) {
    await run(
      'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
      [member.user_id, 'expense_added', 'New Expense', `${req.user.name} added "${description}" for $${amount}`, expenseId]
    );
  }

  const expense = await get(`
    SELECT e.*, u.name as paid_by_name, g.name as group_name
    FROM expenses e
    JOIN users u ON e.paid_by = u.id
    LEFT JOIN groups g ON e.group_id = g.id
    WHERE e.id = ?
  `, [expenseId]);

  const expenseSplits = await all(`
    SELECT es.*, u.name
    FROM expense_splits es
    JOIN users u ON es.user_id = u.id
    WHERE es.expense_id = ?
  `, [expenseId]);

  res.status(201).json({ ...expense, splits: expenseSplits });
});

router.get('/:id', authenticate, async (req, res) => {
  const expense = await get(`
    SELECT e.*, u.name as paid_by_name, g.name as group_name
    FROM expenses e
    JOIN users u ON e.paid_by = u.id
    LEFT JOIN groups g ON e.group_id = g.id
    WHERE e.id = ?
  `, [req.params.id]);

  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const splits = await all(`
    SELECT es.*, u.name
    FROM expense_splits es
    JOIN users u ON es.user_id = u.id
    WHERE es.expense_id = ?
  `, [expense.id]);

  res.json({ ...expense, splits });
});

router.put('/:id', authenticate, async (req, res) => {
  const expense = await get('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  if (expense.paid_by !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const { description, amount, category, date } = req.body;

  await run('UPDATE expenses SET description = COALESCE(?, description), amount = COALESCE(?, amount), category = COALESCE(?, category), date = COALESCE(?, date) WHERE id = ?',
    [description, amount, category, date, req.params.id]);

  if (amount) {
    const splits = await all('SELECT * FROM expense_splits WHERE expense_id = ?', [req.params.id]);
    const perPerson = amount / splits.length;
    for (const split of splits) {
      await run('UPDATE expense_splits SET amount = ? WHERE id = ?', [Math.round(perPerson * 100) / 100, split.id]);
    }
  }

  const updated = await get('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
  res.json(updated);
});

router.delete('/:id', authenticate, async (req, res) => {
  const expense = await get('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  if (expense.paid_by !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  await run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
  res.json({ message: 'Expense deleted' });
});

router.get('/categories/list', authenticate, (req, res) => {
  const categories = [
    'general', 'food', 'transport', 'entertainment', 'utilities',
    'rent', 'groceries', 'dining_out', 'travel', 'shopping',
    'health', 'education', 'subscriptions', 'gifts', 'other'
  ];
  res.json(categories);
});

router.get('/stats/monthly', authenticate, async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const monthlyExpenses = await all(`
    SELECT
      TO_CHAR(e.date, 'MM') as month,
      SUM(e.amount) as total,
      e.category
    FROM expenses e
    WHERE (e.paid_by = ? OR e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = ?))
    AND TO_CHAR(e.date, 'YYYY') = ?
    GROUP BY month, e.category
    ORDER BY month
  `, [req.user.id, req.user.id, String(year)]);

  res.json(monthlyExpenses);
});

module.exports = router;
