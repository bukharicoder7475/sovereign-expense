const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { all } = require('../database');
const { generateMonthlyReport, createPDF } = require('./reportGenerator');

let transporter = null;

function initEmailService() {
  const { SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    console.log('[Email] Gmail service ready');
  } else {
    console.log('[Email] SMTP not configured - emails will be logged only');
  }
}

async function sendMonthlyReports() {
  console.log('[Scheduler] Running monthly report generation...');

  const users = await all('SELECT id, name, email FROM users WHERE email IS NOT NULL AND email != \'\'');
  console.log(`[Scheduler] Found ${users.length} users to process`);

  for (const user of users) {
    try {
      const report = await generateMonthlyReport(user.id);
      if (!report || report.expenses.length === 0) {
        console.log(`[Scheduler] No expenses for ${user.name} (${user.email}), skipping`);
        continue;
      }

      const pdfBuffer = await createPDF(report);
      const monthName = new Date().toLocaleString('default', { month: 'long' });
      const year = new Date().getFullYear();

      const mailOptions = {
        from: `"Ledgerly" <${process.env.SMTP_USER || 'noreply@ledgerly.app'}>`,
        to: user.email,
        subject: `Your ${monthName} ${year} Expense Report - Ledgerly`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #e8e8e8; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; letter-spacing: 4px; color: #c0c0c0; margin: 0;">LEDGERLY</h1>
              <p style="font-size: 12px; color: #888; margin-top: 4px;">Monthly Expense Report</p>
            </div>
            <div style="background: #111; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
              <h2 style="font-size: 18px; color: #e0e0e0; margin: 0 0 8px 0;">${monthName} ${year} Summary</h2>
              <p style="font-size: 13px; color: #888; margin: 0;">Hi ${user.name}, here's your monthly expense breakdown.</p>
            </div>
            <div style="display: flex; gap: 12px; margin-bottom: 20px;">
              <div style="flex: 1; background: #111; border-radius: 10px; padding: 16px; text-align: center;">
                <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Total Paid</div>
                <div style="font-size: 20px; font-weight: 700; color: #e0e0e0; margin-top: 4px;">$${report.totalPaid.toFixed(2)}</div>
              </div>
              <div style="flex: 1; background: #111; border-radius: 10px; padding: 16px; text-align: center;">
                <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Net Balance</div>
                <div style="font-size: 20px; font-weight: 700; color: ${report.netBalance >= 0 ? '#2ECC71' : '#E74C3C'}; margin-top: 4px;">${report.netBalance >= 0 ? '+' : ''}$${report.netBalance.toFixed(2)}</div>
              </div>
              <div style="flex: 1; background: #111; border-radius: 10px; padding: 16px; text-align: center;">
                <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Expenses</div>
                <div style="font-size: 20px; font-weight: 700; color: #e0e0e0; margin-top: 4px;">${report.expenses.length}</div>
              </div>
            </div>
            <p style="font-size: 12px; color: #888; text-align: center;">Your detailed expense report is attached as a PDF.</p>
            <div style="border-top: 1px solid #222; padding-top: 20px; margin-top: 20px; text-align: center;">
              <p style="font-size: 10px; color: #555;">Ledgerly - Premium Expense Management</p>
            </div>
          </div>
        `,
        attachments: [{
          filename: `Ledgerly_${monthName}_${year}_Report.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      };

      if (transporter) {
        await transporter.sendMail(mailOptions);
        console.log(`[Scheduler] Report sent to ${user.email}`);
      } else {
        console.log(`[Scheduler] [DRY RUN] Would send report to ${user.email} (${pdfBuffer.length} bytes)`);
      }
    } catch (err) {
      console.error(`[Scheduler] Error processing ${user.email}:`, err.message);
    }
  }

  console.log('[Scheduler] Monthly report generation complete');
}

function startScheduler() {
  initEmailService();

  cron.schedule('0 9 1 * *', () => {
    sendMonthlyReports();
  }, { timezone: 'UTC' });

  console.log('[Scheduler] Monthly report cron scheduled (1st of each month at 9:00 AM UTC)');
}

module.exports = { startScheduler, sendMonthlyReports };
