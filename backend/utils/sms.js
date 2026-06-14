const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

if (accountSid && authToken && accountSid !== 'your_twilio_account_sid') {
  client = twilio(accountSid, authToken);
}

async function sendSMS(to, body) {
  if (!client) {
    console.log(`[SMS DISABLED] To: ${to} | Message: ${body}`);
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    console.log(`[SMS SENT] To: ${to} | SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error(`[SMS FAILED] To: ${to} | Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function sendOTP(phone, code) {
  const message = `Your Ledgerly verification code is: ${code}. It expires in 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phone, message);
}

module.exports = { sendSMS, sendOTP };
