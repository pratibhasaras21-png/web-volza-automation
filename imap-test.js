const { ImapFlow } = require('imapflow');
const dotenv = require('dotenv');

dotenv.config({ path: ['.env', '.env.local'] });

async function testImap() {
  console.log('--- IMAP Connection Test ---');
  console.log(`GMAIL_USER        : ${process.env.GMAIL_USER}`);
  console.log(`GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '*** (set)' : 'NOT SET'}`);
  console.log('');

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: console,
  });

  try {
    await client.connect();
    console.log('✅ IMAP connection successful\n');

    await client.mailboxOpen('INBOX');

    // Fetch last 10 emails to show subjects
    const since = new Date();
    since.setDate(since.getDate() - 1); // last 24 hours

    const uids = await client.search({ since }, { uid: true });
    console.log(`Found ${uids.length} email(s) in the last 24 hours\n`);

    const recent = [...uids].reverse().slice(0, 10);
    for (const uid of recent) {
      const msg = await client.fetchOne(String(uid), { envelope: true }, { uid: true });
      if (!msg) continue;
      const subject = msg.envelope?.subject ?? '(no subject)';
      const from = msg.envelope?.from?.[0]?.address ?? '(unknown)';
      const date = msg.envelope?.date?.toISOString() ?? '';
      console.log(`  UID ${uid} | From: ${from} | Subject: "${subject}" | Date: ${date}`);
    }

    await client.logout();
  } catch (err) {
    console.error('❌ IMAP error:', err);
  }
}

testImap();
