const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/monthly-report', authenticate, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const monthStr = String(currentMonth).padStart(2, '0');

    const expenses = await all(`
      SELECT e.*, u.name as paid_by_name, g.name as group_name
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      LEFT JOIN groups g ON e.group_id = g.id
      WHERE (e.paid_by = $1 OR e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1))
      AND TO_CHAR(e.date, 'YYYY-MM') = $2
      ORDER BY e.date DESC
    `, [req.user.id, `${year}-${monthStr}`]);

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryBreakdown = {};
    expenses.forEach(e => {
      if (!categoryBreakdown[e.category]) categoryBreakdown[e.category] = 0;
      categoryBreakdown[e.category] += e.amount;
    });

    const paidByMe = expenses.filter(e => e.paid_by === req.user.id);
    const totalPaidByMe = paidByMe.reduce((sum, e) => sum + e.amount, 0);

    const mySplits = await all(`
      SELECT es.amount
      FROM expense_splits es
      JOIN expenses e ON es.expense_id = e.id
      WHERE es.user_id = $1
      AND TO_CHAR(e.date, 'YYYY-MM') = $2
    `, [req.user.id, `${year}-${monthStr}`]);

    const totalMyShare = mySplits.reduce((sum, s) => sum + s.amount, 0);

    const topExpense = expenses.length > 0
      ? expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0])
      : null;

    const report = {
      month: `${year}-${monthStr}`,
      total_spent: Math.round(totalSpent * 100) / 100,
      total_expenses: expenses.length,
      category_breakdown: categoryBreakdown,
      paid_by_me: Math.round(totalPaidByMe * 100) / 100,
      my_share: Math.round(totalMyShare * 100) / 100,
      net_balance: Math.round((totalPaidByMe - totalMyShare) * 100) / 100,
      top_expense: topExpense,
      expenses
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

router.get('/ai-analysis', authenticate, async (req, res) => {
  try {
    const expenses = await all(`
      SELECT e.*, u.name as paid_by_name, g.name as group_name
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      LEFT JOIN groups g ON e.group_id = g.id
      WHERE (e.paid_by = $1 OR e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1))
      AND e.date >= CURRENT_DATE - INTERVAL '90 days'
      ORDER BY e.date DESC
    `, [req.user.id]);

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const avgPerExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

    const categoryTotals = {};
    expenses.forEach(e => {
      if (!categoryTotals[e.category]) categoryTotals[e.category] = 0;
      categoryTotals[e.category] += e.amount;
    });

    const monthlyTotals = {};
    expenses.forEach(e => {
      const month = e.date.substring(0, 7);
      if (!monthlyTotals[month]) monthlyTotals[month] = 0;
      monthlyTotals[month] += e.amount;
    });

    const analysis = {
      period: 'Last 90 days',
      total_spent: Math.round(totalSpent * 100) / 100,
      total_expenses: expenses.length,
      avg_per_expense: Math.round(avgPerExpense * 100) / 100,
      category_breakdown: categoryTotals,
      monthly_trend: monthlyTotals,
      insights: generateInsights(expenses, categoryTotals, monthlyTotals)
    };

    res.json(analysis);
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    res.status(500).json({ error: 'Failed to generate AI analysis' });
  }
});

function generateInsights(expenses, categories, monthly) {
  const insights = [];

  if (expenses.length === 0) {
    return ['No expenses recorded yet. Start tracking to get insights!'];
  }

  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    const percentage = ((topCategory[1] / Object.values(categories).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
    insights.push(`Your highest spending category is "${topCategory[0]}" at $${topCategory[1].toFixed(2)} (${percentage}% of total).`);
  }

  const monthlyValues = Object.values(monthly);
  if (monthlyValues.length >= 2) {
    const lastMonth = monthlyValues[monthlyValues.length - 1];
    const prevMonth = monthlyValues[monthlyValues.length - 2];
    const change = ((lastMonth - prevMonth) / prevMonth * 100).toFixed(1);
    if (change > 0) {
      insights.push(`Spending increased by ${change}% from the previous month.`);
    } else {
      insights.push(`Spending decreased by ${Math.abs(change)}% from the previous month. Great job!`);
    }
  }

  const avgPerMonth = monthlyValues.length > 0
    ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
    : 0;
  insights.push(`Your average monthly spending is $${avgPerMonth.toFixed(2)}.`);

  const groupExpenses = expenses.filter(e => e.group_id);
  if (groupExpenses.length > 0) {
    insights.push(`${groupExpenses.length} of your expenses are shared with groups.`);
  }

  const recentExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    const now = new Date();
    return (now - date) < 7 * 24 * 60 * 60 * 1000;
  });
  if (recentExpenses.length > 5) {
    insights.push(`You've had ${recentExpenses.length} expenses this week. Keep an eye on your spending!`);
  }

  return insights;
}

module.exports = router;
