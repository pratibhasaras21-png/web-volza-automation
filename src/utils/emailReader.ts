import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
import { extractOtp } from './otpParser';

dotenv.config();

/**
 * Decodes a raw MIME message and returns all readable text content.
 * Handles base64 and quoted-printable encoded parts so the OTP parser
 * never runs against encoded/header noise.
 */
function extractTextFromMime(raw: string): string {
  const decoded: string[] = [];

  // Decode every base64-encoded MIME part
  const base64Parts = raw.split(/Content-Transfer-Encoding:\s*base64\s*\r?\n\r?\n/i);
  for (let i = 1; i < base64Parts.length; i++) {
    const block = base64Parts[i].split(/\r?\n--/)[0].replace(/\s/g, '');
    try {
      decoded.push(Buffer.from(block, 'base64').toString('utf8'));
    } catch {
      // skip malformed block
    }
  }

  // Decode every quoted-printable MIME part
  const qpParts = raw.split(/Content-Transfer-Encoding:\s*quoted-printable\s*\r?\n\r?\n/i);
  for (let i = 1; i < qpParts.length; i++) {
    const block = qpParts[i].split(/\r?\n--/)[0];
    const text = block
      .replace(/=\r?\n/g, '')
      .replace(/=([A-Fa-f0-9]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    decoded.push(text);
  }

  // If no encoded parts found, strip MIME headers and use the raw body as-is
  if (decoded.length === 0) {
    const bodyStart = raw.search(/\r?\n\r?\n/);
    decoded.push(bodyStart >= 0 ? raw.slice(bodyStart) : raw);
  }

  return decoded.join('\n');
}

interface OtpReadOptions {
  senderDomain?: string;
  subjectKeyword?: string;
  waitMs?: number;
  pollIntervalMs?: number;
  receivedAfter?: Date;
}

export async function readOtpFromGmail(options: OtpReadOptions = {}): Promise<string> {
  const {
    senderDomain = process.env.OTP_SENDER_DOMAIN ?? 'volza.com',
    subjectKeyword = process.env.OTP_SUBJECT_KEYWORD ?? 'OTP',
    waitMs = parseInt(process.env.OTP_WAIT_MS ?? '60000'),
    pollIntervalMs = parseInt(process.env.OTP_POLL_INTERVAL_MS ?? '5000'),
    receivedAfter = new Date(Date.now() - 30_000),
  } = options;

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  const deadline = Date.now() + waitMs;

  await client.connect();

  try {
    await client.mailboxOpen('INBOX');

    while (Date.now() < deadline) {
      const uids: number[] = await client.search(
        { since: receivedAfter, from: `@${senderDomain}` },
        { uid: true }
      ) as number[];

      for (const uid of [...uids].reverse()) {
        const msg = await client.fetchOne(
          String(uid),
          { envelope: true },
          { uid: true }
        );

        if (!msg) continue;

        const subject = msg.envelope?.subject ?? '';
        if (!subject.toLowerCase().includes(subjectKeyword.toLowerCase())) {
          continue;
        }

        const download = await client.download(String(uid), undefined, { uid: true });
        let rawBody = '';
        for await (const chunk of download.content) {
          rawBody += chunk.toString('utf8');
        }

        const bodyText = extractTextFromMime(rawBody);
        console.log(`[emailReader] Decoded body for UID ${uid}: ${bodyText.slice(0, 300)}`);
        const otp = extractOtp(bodyText);
        if (otp) {
          console.log(`[emailReader] OTP found in email UID ${uid}: ${otp}`);
          return otp;
        }
      }

      if (Date.now() < deadline) {
        console.log(`[emailReader] OTP not found yet, retrying in ${pollIntervalMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
    }

    throw new Error(`OTP not received within ${waitMs}ms from @${senderDomain}`);
  } finally {
    await client.logout();
  }
}
