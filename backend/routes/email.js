const express = require('express');
const { run, get, all } = require('../database');
const authenticate = require('../middleware/auth');
const { generateMonthlyReport, createPDF } = require('../utils/reportGenerator');

const router = express.Router();

router.post('/send-report', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.email) {
      return res.status(400).json({ error: 'No email on file' });
    }

    const report = await generateMonthlyReport(req.user.id);
    if (!report || report.expenses.length === 0) {
      return res.status(400).json({ error: 'No expenses to report this month' });
    }

    const pdfBuffer = await createPDF(report);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Lederly_${report.monthName}_${report.year}_Report.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.post('/generate-report', authenticate, async (req, res) => {
  try {
    const report = await generateMonthlyReport(req.user.id);
    if (!report) {
      return res.status(404).json({ error: 'No data found' });
    }

    const pdfBuffer = await createPDF(report);
    const base64 = pdfBuffer.toString('base64');

    res.json({
      report: {
        month: report.monthName,
        year: report.year,
        totalPaid: report.totalPaid,
        totalOwed: report.totalOwed,
        netBalance: report.netBalance,
        expensesCount: report.expenses.length,
        categoryBreakdown: report.categoryBreakdown,
        groupBreakdown: report.groupBreakdown
      },
      pdf: base64
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.post('/send-expense-summary', authenticate, async (req, res) => {
  const { recipientEmail } = req.body;

  if (!recipientEmail) {
    return res.status(400).json({ error: 'Recipient email is required' });
  }

  try {
    const report = await generateMonthlyReport(req.user.id);
    if (!report || report.expenses.length === 0) {
      return res.status(400).json({ error: 'No expenses to report' });
    }

    const pdfBuffer = await createPDF(report);

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    await transporter.sendMail({
      from: `"Lederly" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `${report.monthName} ${report.year} Expense Report - Lederly`,
      html: `<div style="font-family:sans-serif;padding:40px;background:#000;color:#e8e8e8;"><h1 style="color:#c0c0c0;letter-spacing:4px;">LEDGERLY</h1><p>Your monthly expense report is attached.</p></div>`,
      attachments: [{
        filename: `Lederly_${report.monthName}_${report.year}_Report.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    res.json({ message: 'Report sent successfully' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
