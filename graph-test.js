const dotenv = require('dotenv');
dotenv.config({ path: ['.env', '.env.local'] });

async function testGraphApi() {
  console.log('--- Microsoft Graph API Test ---');
  console.log(`AZURE_TENANT_ID    : ${process.env.AZURE_TENANT_ID}`);
  console.log(`AZURE_CLIENT_ID    : ${process.env.AZURE_CLIENT_ID}`);
  console.log(`AZURE_CLIENT_SECRET: ${process.env.AZURE_CLIENT_SECRET ? '*** (set)' : 'NOT SET'}`);
  console.log(`OUTLOOK_USER       : ${process.env.OUTLOOK_USER}`);
  console.log('');

  // Step 1: Get access token
  const tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
  });

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error('❌ Token error:', tokenData.error, '-', tokenData.error_description);
    return;
  }

  console.log('✅ Access token obtained\n');

  // Step 2: Fetch recent emails
  const user = process.env.OUTLOOK_USER;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `https://graph.microsoft.com/v1.0/users/${user}/messages?$filter=receivedDateTime ge ${since}&$select=subject,from,receivedDateTime&$orderby=receivedDateTime desc&$top=10`;

  const mailRes = await fetch(url, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const mailData = await mailRes.json();

  if (!mailRes.ok) {
    console.error('❌ Mail API error:', mailData.error?.code, '-', mailData.error?.message);
    return;
  }

  console.log(`✅ Found ${mailData.value.length} email(s) in last 24 hours:\n`);
  for (const msg of mailData.value) {
    console.log(`  From: ${msg.from?.emailAddress?.address}`);
    console.log(`  Subject: "${msg.subject}"`);
    console.log(`  Received: ${msg.receivedDateTime}`);
    console.log('');
  }
}

testGraphApi().catch(console.error);
