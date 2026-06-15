const get = (key: string, fallback = ''): string => {
  const value = process.env[key];
  return value && value.length > 0 ? value : fallback;
};

export const env = {
  NODE_ENV: get('NODE_ENV', 'development'),
  PORT: Number(get('PORT', '3000')),
  FRONTEND_URL: get('FRONTEND_URL', 'http://localhost:5173'),

  JWT_ACCESS_SECRET: get('JWT_ACCESS_SECRET', 'dev-access-secret'),
  JWT_ACCESS_EXPIRES_IN: get('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_SECRET: get('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  JWT_RESET_SECRET: get('JWT_RESET_SECRET', 'dev-reset-secret'),

  CLIENT_ID: get('CLIENT_ID'),
  CLIENT_SECRET: get('CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL: get(
    'GOOGLE_CALLBACK_URL',
    'http://localhost:3000/auth/google/callback',
  ),

  COOKIE_DOMAIN: get('COOKIE_DOMAIN', ''),
};
