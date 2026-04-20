import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  it('should be defined', () => {
    const configService = {
      get: jest.fn(),
    };

    expect(new ApiKeyGuard(configService as any)).toBeDefined();
  });
});
