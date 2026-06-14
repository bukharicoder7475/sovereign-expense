const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const settlements = await all(`
      SELECT s.*,
        payer.name as payer_name,
        payee.name as payee_name,
        g.name as group_name
      FROM settlements s
      JOIN users payer ON s.payer_id = payer.id
      JOIN users payee ON s.payee_id = payee.id
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.payer_id = $1 OR s.payee_id = $1
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json(settlements);
  } catch (err) {
    console.error('GET /settlements error:', err);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { payee_id, amount, group_id, note } = req.body;
    if (!payee_id || !amount) return res.status(400).json({ error: 'Payee and amount are required' });

    const settlementId = await run(
      'INSERT INTO settlements (payer_id, payee_id, amount, group_id, note) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, payee_id, amount, group_id || null, note || '']
    );

    const settlement = await get(`
      SELECT s.*, payer.name as payer_name, payee.name as payee_name
      FROM settlements s
      JOIN users payer ON s.payer_id = payer.id
      JOIN users payee ON s.payee_id = payee.id
      WHERE s.id = $1
    `, [settlementId]);

    await run(
      'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES ($1, $2, $3, $4, $5)',
      [payee_id, 'settlement', 'Payment Received', `${req.user.name} paid you ${amount}`, settlementId]
    );

    res.status(201).json(settlement);
  } catch (err) {
    console.error('POST /settlements error:', err);
    res.status(500).json({ error: 'Failed to create settlement' });
  }
});

router.get('/balances', authenticate, async (req, res) => {
  try {
    const userExpenses = await all(`
      SELECT e.paid_by as paid_by_id, es.user_id, es.amount, es.is_settled
      FROM expenses e
      JOIN expense_splits es ON e.id = es.expense_id
      WHERE (e.paid_by = $1 OR es.user_id = $1)
      AND es.user_id != e.paid_by
    `, [req.user.id]);

    const userSettlements = await all(`
      SELECT payer_id, payee_id, amount
      FROM settlements
      WHERE payer_id = $1 OR payee_id = $1
    `, [req.user.id]);

    const balances = {};

    for (const exp of userExpenses) {
      const otherId = exp.paid_by_id === req.user.id ? exp.user_id : exp.paid_by_id;
      if (!balances[otherId]) balances[otherId] = 0;
      if (exp.paid_by_id === req.user.id) {
        balances[otherId] -= exp.amount;
      } else {
        balances[otherId] += exp.amount;
      }
    }

    for (const s of userSettlements) {
      const otherId = s.payer_id === req.user.id ? s.payee_id : s.payer_id;
      if (!balances[otherId]) balances[otherId] = 0;
      if (s.payer_id === req.user.id) {
        balances[otherId] += s.amount;
      } else {
        balances[otherId] -= s.amount;
      }
    }

    const result = Object.entries(balances)
      .map(([userId, balance]) => ({
        userId: parseInt(userId),
        balance: Math.round(balance * 100) / 100
      }))
      .filter(b => Math.abs(b.balance) > 0.01);

    const userIds = result.map(b => b.userId);
    if (userIds.length === 0) return res.json([]);

    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    const users = await all(`SELECT id, name FROM users WHERE id IN (${placeholders})`, userIds);

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    const enriched = result.map(b => ({
      ...b,
      name: userMap[b.userId] || 'Unknown',
      you_owe: b.balance < 0,
      they_owe: b.balance > 0,
      amount: Math.abs(b.balance)
    }));

    res.json(enriched);
  } catch (err) {
    console.error('GET /settlements/balances error:', err);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

router.get('/simplify', authenticate, async (req, res) => {
  try {
    const balances = await all(`
      SELECT e.paid_by as creditor, es.user_id as debtor, SUM(es.amount) as amount
      FROM expenses e
      JOIN expense_splits es ON e.id = es.expense_id
      WHERE es.user_id != e.paid_by AND es.is_settled = 0
      GROUP BY e.paid_by, es.user_id
    `, []);

    const net = {};
    for (const b of balances) {
      if (!net[b.creditor]) net[b.creditor] = 0;
      if (!net[b.debtor]) net[b.debtor] = 0;
      net[b.creditor] += b.amount;
      net[b.debtor] -= b.amount;
    }

    const debtors = [];
    const creditors = [];

    for (const [userId, amount] of Object.entries(net)) {
      if (amount < -0.01) debtors.push({ userId: parseInt(userId), amount: Math.abs(amount) });
      else if (amount > 0.01) creditors.push({ userId: parseInt(userId), amount });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let di = 0, ci = 0;

    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.min(debtors[di].amount, creditors[ci].amount);
      if (amount > 0.01) {
        transactions.push({
          from: debtors[di].userId,
          to: creditors[ci].userId,
          amount: Math.round(amount * 100) / 100
        });
      }
      debtors[di].amount -= amount;
      creditors[ci].amount -= amount;
      if (debtors[di].amount < 0.01) di++;
      if (creditors[ci].amount < 0.01) ci++;
    }

    const userIds = [...new Set(transactions.flatMap(t => [t.from, t.to]))];
    if (userIds.length > 0) {
      const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
      const users = await all(`SELECT id, name FROM users WHERE id IN (${placeholders})`, userIds);
      const userMap = {};
      users.forEach(u => { userMap[u.id] = u.name; });

      const enriched = transactions.map(t => ({
        from: t.from,
        from_name: userMap[t.from] || 'Unknown',
        to: t.to,
        to_name: userMap[t.to] || 'Unknown',
        amount: t.amount
      }));

      return res.json(enriched);
    }

    res.json(transactions);
  } catch (err) {
    console.error('GET /settlements/simplify error:', err);
    res.status(500).json({ error: 'Failed to simplify debts' });
  }
});

module.exports = router;
