/**
 * Extract a numeric OTP from email body text.
 * Prefers 6-digit matches with OTP-related keywords; falls back to any standalone 6-digit number.
 */
export function extractOtp(text: string): string | null {
  const patterns = [
    // 6-digit specific patterns with OTP keywords (highest priority)
    /\botp[:\s]+(\d{6})\b/i,
    /\bverification\s+code[:\s]+(\d{6})\b/i,
    /\bpasscode[:\s]+(\d{6})\b/i,
    /\bone.?time[:\s]+(\d{6})\b/i,
    /\bcode[:\s]+(\d{6})\b/i,
    /\b(\d{6})\b(?=\s*(?:is\s+your|as\s+your|for\s+your))/i,
    // General 4-8 digit patterns with OTP keywords
    /\botp[:\s]+(\d{4,8})\b/i,
    /\bverification\s+code[:\s]+(\d{4,8})\b/i,
    /\bpasscode[:\s]+(\d{4,8})\b/i,
    /\bone.?time[:\s]+(\d{4,8})\b/i,
    /\bcode[:\s]+(\d{4,8})\b/i,
    /\b(\d{4,8})\b(?=\s*(?:is\s+your|as\s+your|for\s+your))/i,
    // Last resort: any standalone 6-digit number (avoids 4-digit MIME artefacts)
    /\b(\d{6})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}
