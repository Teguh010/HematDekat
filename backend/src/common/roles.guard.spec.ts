import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function contextWithRole(role?: 'USER' | 'ADMIN'): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  } as unknown as ExecutionContext;
}

const reflector = { getAllAndOverride: () => ['ADMIN'] } as unknown as Reflector;

describe('RolesGuard', () => {
  it('allows admins', () => {
    expect(new RolesGuard(reflector).canActivate(contextWithRole('ADMIN'))).toBe(true);
  });

  it('rejects normal users', () => {
    expect(() => new RolesGuard(reflector).canActivate(contextWithRole('USER'))).toThrow(ForbiddenException);
  });

  it('rejects missing users', () => {
    expect(() => new RolesGuard(reflector).canActivate(contextWithRole())).toThrow(ForbiddenException);
  });
});
