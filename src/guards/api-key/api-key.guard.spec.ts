import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  const guard = new ApiKeyGuard(
    new ConfigService({ API_KEY: 'test-only-key' }),
  );
  const context = (key?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'api-key': key } }),
      }),
    }) as ExecutionContext;
  it('rejects missing and incorrect credentials', () => {
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context('wrong'))).toThrow(
      UnauthorizedException,
    );
  });
  it('accepts the configured application credential', () => {
    expect(guard.canActivate(context('test-only-key'))).toBe(true);
  });
});
