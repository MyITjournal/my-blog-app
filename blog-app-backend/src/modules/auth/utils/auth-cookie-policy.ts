export type AuthCookieBaseOptions = {
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: '/';
  domain?: string;
};

/**
 * Resolves httpOnly auth cookie attributes by environment.
 *
 * - production: SameSite=None; Secure for cross-domain frontends (e.g. Vercel + Render)
 * - staging: SameSite=None; Secure for cross-origin frontends
 * - development/test: host-only, lax for local HTTP
 */
export function resolveAuthCookieOptions(
  nodeEnv: string,
  cookieDomain: string,
): AuthCookieBaseOptions {
  const domain = cookieDomain.length > 0 ? cookieDomain : undefined;

  if (nodeEnv === 'production' || nodeEnv === 'staging') {
    return {
      secure: true,
      sameSite: 'none',
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  return {
    secure: false,
    sameSite: 'lax',
    path: '/',
  };
}
