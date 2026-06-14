declare namespace NodeJS {
  interface ProcessEnv {
    GMAIL_USER: string;
    GMAIL_APP_PASSWORD: string;
    VOLZA_LOGIN_EMAIL: string;
    OTP_SENDER_DOMAIN: string;
    OTP_SUBJECT_KEYWORD: string;
    OTP_WAIT_MS: string;
    OTP_POLL_INTERVAL_MS: string;
  }
}
