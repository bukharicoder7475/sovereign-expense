const PDFDocument = require('pdfkit');
const { get, all } = require('../database');

async function generateMonthlyReport(userId) {
  const user = await get('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });

  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const expenses = await all(`
    SELECT e.*, u.name as paid_by_name, g.name as group_name
    FROM expenses e
    JOIN users u ON e.paid_by = u.id
    LEFT JOIN groups g ON e.group_id = g.id
    WHERE e.paid_by = $1 AND e.date >= $2 AND e.date <= $3
    ORDER BY e.date ASC
  `, [userId, startDate, endDate]);

  const allExpenses = await all(`
    SELECT e.*, u.name as paid_by_name, g.name as group_name
    FROM expenses e
    JOIN users u ON e.paid_by = u.id
    LEFT JOIN groups g ON e.group_id = g.id
    WHERE e.date >= $1 AND e.date <= $2
    ORDER BY e.date ASC
  `, [startDate, endDate]);

  const splits = await all(`
    SELECT es.*, e.description, e.amount as total_amount, e.category, e.date
    FROM expense_splits es
    JOIN expenses e ON es.expense_id = e.id
    WHERE es.user_id = $1 AND es.is_settled = 0 AND e.date >= $2 AND e.date <= $3
  `, [userId, startDate, endDate]);

  const settlements = await all(`
    SELECT s.*, payer.name as payer_name, payee.name as payee_name
    FROM settlements s
    JOIN users payer ON s.payer_id = payer.id
    JOIN users payee ON s.payee_id = payee.id
    WHERE (s.payer_id = $1 OR s.payee_id = $1) AND s.created_at >= $2 AND s.created_at <= $3
  `, [userId, startDate, endDate]);

  const totalPaid = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOwed = splits.reduce((sum, s) => sum + s.amount, 0);
  const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
  const netBalance = totalPaid - totalOwed;

  const categoryBreakdown = {};
  expenses.forEach(e => {
    const cat = e.category || 'General';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + e.amount;
  });

  const groupBreakdown = {};
  expenses.forEach(e => {
    const grp = e.group_name || 'Personal';
    groupBreakdown[grp] = (groupBreakdown[grp] || 0) + e.amount;
  });

  return {
    user, monthName, year, expenses, allExpenses, splits, settlements,
    totalPaid, totalOwed, totalSettled, netBalance,
    categoryBreakdown, groupBreakdown
  };
}

function createPDF(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Lederly - ${report.monthName} ${report.year} Expense Report`,
        Author: 'Lederly',
      }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const silver = '#C0C0C0';
    const dark = '#1a1a1a';
    const muted = '#888888';
    const lightBg = '#f8f8f8';
    const green = '#2ECC71';
    const red = '#E74C3C';

    doc.rect(0, 0, 595.28, 841.89).fill('#ffffff');

    doc.fontSize(10).fillColor(muted).font('Helvetica')
      .text('LEDGERLY', 50, 50, { continued: true })
      .text(`  |  Monthly Expense Report`, { align: 'left' });

    doc.moveTo(50, 72).lineTo(545, 72).lineWidth(0.5).strokeColor(silver).stroke();

    doc.fontSize(28).fillColor(dark).font('Helvetica-Bold')
      .text(`${report.monthName} ${report.year}`, 50, 90);

    doc.fontSize(11).fillColor(muted).font('Helvetica')
      .text(`Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 125);

    doc.fontSize(10).fillColor(muted)
      .text(`Account: ${report.user.name}  |  ${report.user.email}`, 50, 142);

    let y = 175;
    doc.rect(50, y, 495, 70).fill(lightBg);
    doc.fillColor(dark);

    const summaryX = [70, 190, 310, 430];
    const summaryLabels = ['Total Paid', 'You Owe', 'Net Balance', 'Transactions'];
    const summaryValues = [
      `$${report.totalPaid.toFixed(2)}`,
      `$${report.totalOwed.toFixed(2)}`,
      `${report.netBalance >= 0 ? '+' : ''}$${report.netBalance.toFixed(2)}`,
      String(report.expenses.length)
    ];
    const summaryColors = [dark, red, report.netBalance >= 0 ? green : red, dark];

    summaryLabels.forEach((label, i) => {
      doc.fontSize(8).fillColor(muted).font('Helvetica')
        .text(label, summaryX[i], y + 12, { width: 110 });
      doc.fontSize(16).fillColor(summaryColors[i]).font('Helvetica-Bold')
        .text(summaryValues[i], summaryX[i], y + 30, { width: 110 });
    });

    y = 265;
    doc.fontSize(12).fillColor(dark).font('Helvetica-Bold')
      .text('Expense Breakdown', 50, y);
    y += 20;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(0.3).strokeColor(silver).stroke();
    y += 12;

    if (Object.keys(report.categoryBreakdown).length > 0) {
      const maxVal = Math.max(...Object.values(report.categoryBreakdown));

      Object.entries(report.categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
          if (y > 750) { doc.addPage(); y = 50; }

          doc.fontSize(9).fillColor(dark).font('Helvetica')
            .text(cat, 60, y, { width: 120 });

          const barWidth = (amount / maxVal) * 250;
          doc.rect(190, y + 2, barWidth, 12).fill(silver);

          doc.fontSize(9).fillColor(dark).font('Helvetica-Bold')
            .text(`$${amount.toFixed(2)}`, 450, y, { width: 80, align: 'right' });

          const pct = report.totalPaid > 0 ? ((amount / report.totalPaid) * 100).toFixed(1) : '0';
          doc.fontSize(7).fillColor(muted).font('Helvetica')
            .text(`${pct}%`, 190 + barWidth + 6, y + 3);

          y += 22;
        });
    } else {
      doc.fontSize(9).fillColor(muted).font('Helvetica')
        .text('No expenses this month', 60, y);
      y += 20;
    }

    y += 15;
    doc.fontSize(12).fillColor(dark).font('Helvetica-Bold')
      .text('Group Summary', 50, y);
    y += 20;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(0.3).strokeColor(silver).stroke();
    y += 12;

    if (Object.keys(report.groupBreakdown).length > 0) {
      Object.entries(report.groupBreakdown)
        .sort((a, b) => b[1] - a[1])
        .forEach(([group, amount]) => {
          if (y > 750) { doc.addPage(); y = 50; }

          doc.fontSize(9).fillColor(dark).font('Helvetica')
            .text(group, 60, y, { width: 250 });

          doc.fontSize(9).fillColor(dark).font('Helvetica-Bold')
            .text(`$${amount.toFixed(2)}`, 450, y, { width: 80, align: 'right' });

          y += 18;
        });
    }

    y += 15;
    doc.fontSize(12).fillColor(dark).font('Helvetica-Bold')
      .text('Transaction History', 50, y);
    y += 20;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(0.3).strokeColor(silver).stroke();
    y += 12;

    if (report.expenses.length > 0) {
      doc.fontSize(7).fillColor(muted).font('Helvetica')
        .text('DATE', 60, y, { width: 70 })
        .text('DESCRIPTION', 135, y, { width: 180 })
        .text('GROUP', 320, y, { width: 100 })
        .text('AMOUNT', 440, y, { width: 80, align: 'right' });
      y += 14;
      doc.moveTo(50, y).lineTo(545, y).lineWidth(0.2).strokeColor(silver).stroke();
      y += 6;

      report.expenses.forEach(expense => {
        if (y > 760) {
          doc.addPage();
          y = 50;
          doc.rect(0, 0, 595.28, 841.89).fill('#ffffff');
        }

        const dateStr = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (report.expenses.indexOf(expense) % 2 === 0) {
          doc.rect(50, y - 2, 495, 16).fill(lightBg);
        }

        doc.fontSize(8).fillColor(dark).font('Helvetica')
          .text(dateStr, 60, y, { width: 70 })
          .text(expense.description.substring(0, 35), 135, y, { width: 180 })
          .text((expense.group_name || 'Personal').substring(0, 15), 320, y, { width: 100 })
          .text(`$${expense.amount.toFixed(2)}`, 440, y, { width: 80, align: 'right' });

        y += 16;
      });
    } else {
      doc.fontSize(9).fillColor(muted).font('Helvetica')
        .text('No transactions this month', 60, y);
    }

    y += 30;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).strokeColor(silver).stroke();
    y += 12;
    doc.fontSize(7).fillColor(muted).font('Helvetica')
      .text('This report was automatically generated by Lederly. For questions, contact support.', 50, y, { align: 'center', width: 495 });

    doc.end();
  });
}

module.exports = { generateMonthlyReport, createPDF };
