const config = {
  authorizedEmails: process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS ? process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS.split(',') : []
};

export default config;