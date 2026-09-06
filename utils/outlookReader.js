const dotenv = require('dotenv');
const { extractOtp } = require('./otpParser');

dotenv.config({ path: ['.env', '.env.local'] });

async function getAccessToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function readOtpFromOutlook(options = {}) {
  const {
    senderDomain = process.env.OTP_SENDER_DOMAIN ?? 'volza.com',
    subjectKeyword = process.env.OTP_SUBJECT_KEYWORD ?? 'OTP',
    waitMs = parseInt(process.env.OTP_WAIT_MS ?? '60000'),
    pollIntervalMs = parseInt(process.env.OTP_POLL_INTERVAL_MS ?? '5000'),
    receivedAfter = new Date(Date.now() - 30_000),
  } = options;

  const user = process.env.OUTLOOK_USER;
  const deadline = Date.now() + waitMs;

  console.log(`[outlookReader] Reading OTP for ${user} from @${senderDomain} emails`);

  while (Date.now() < deadline) {
    const token = await getAccessToken();

    // Filter: received after timestamp, from sender domain, subject contains keyword
    const receivedAfterIso = receivedAfter.toISOString();
    const filter = [
      `receivedDateTime ge ${receivedAfterIso}`,
      `contains(from/emailAddress/address, '@${senderDomain}')`,
      `contains(subject, '${subjectKeyword}')`,
    ].join(' and ');

    const url = `https://graph.microsoft.com/v1.0/users/${user}/messages?$filter=${encodeURIComponent(filter)}&$select=subject,body,receivedDateTime&$orderby=receivedDateTime desc&$top=5`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Graph API error: ${err}`);
    }

    const data = await res.json();
    console.log(`[outlookReader] Found ${data.value.length} matching email(s)`);

    for (const msg of data.value) {
      console.log(`[outlookReader] Subject: "${msg.subject}" | Received: ${msg.receivedDateTime}`);
      const otp = extractOtp(msg.body.content.replace(/<[^>]+>/g, ' '));
      if (otp) {
        console.log(`[outlookReader] OTP found: ${otp}`);
        return otp;
      }
    }

    if (Date.now() < deadline) {
      console.log(`[outlookReader] OTP not found yet, retrying in ${pollIntervalMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }

  throw new Error(`OTP not received within ${waitMs}ms from @${senderDomain}`);
}

module.exports = { readOtpFromOutlook };
