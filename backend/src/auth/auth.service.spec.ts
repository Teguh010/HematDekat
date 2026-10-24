import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  it('hashes and verifies a password', async () => {
    const service = new AuthService();
    const hash = await service.hashPassword('secret-password');

    await expect(service.verifyPassword('secret-password', hash)).resolves.toBe(true);
    await expect(service.verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('builds a JWT cookie payload and options', () => {
    const service = new AuthService();
    const cookie = service.buildJwtCookie('user-123');

    expect(cookie.name).toBe('access_token');
    expect(cookie.value).toBe('user-123');
    expect(cookie.options.httpOnly).toBe(true);
    expect(cookie.options.sameSite).toBe('lax');
    expect(cookie.options.secure).toBe(false);
  });
});
