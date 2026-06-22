import { resolveAuthCookieOptions } from './auth-cookie-policy';

describe('resolveAuthCookieOptions', () => {
  it('uses SameSite=none and Secure in production for cross-domain frontends', () => {
    expect(
      resolveAuthCookieOptions('production', ''),
    ).toEqual({
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  });

  it('includes domain in production when COOKIE_DOMAIN is set', () => {
    expect(
      resolveAuthCookieOptions('production', '.example.com'),
    ).toEqual({
      secure: true,
      sameSite: 'none',
      path: '/',
      domain: '.example.com',
    });
  });

  it('uses SameSite=none and Secure in staging', () => {
    expect(
      resolveAuthCookieOptions('staging', ''),
    ).toEqual({
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  });

  it('omits domain and uses lax SameSite in development', () => {
    expect(resolveAuthCookieOptions('development', '')).toEqual({
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('omits domain and uses lax SameSite in test', () => {
    expect(resolveAuthCookieOptions('test', '')).toEqual({
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });
});
