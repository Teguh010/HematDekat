import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Throttles by the authenticated user's id, falling back to the request IP
 * when no user is attached yet (for example an expired or missing JWT).
 * Must run after JwtAuthGuard so `req.user` is populated.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request & { user?: { id: string } }): Promise<string> {
    return req.user?.id ?? req.ip ?? 'unknown';
  }
}
