import { validateEnvironment } from './environment';

describe('environment', () => {
  const config = { API_KEY: 'unit-test-only-credential-32-characters' };
  it('rejects database credentials even with a valid API key', () => {
    expect(() =>
      validateEnvironment({ ...config, DB_HOST: 'postgres' }),
    ).toThrow();
    expect(() =>
      validateEnvironment({ ...config, DATABASE_URL: 'unused' }),
    ).toThrow();
  });
  it('rejects missing or weak API keys', () => {
    expect(() => validateEnvironment({})).toThrow();
    expect(() => validateEnvironment({ API_KEY: 'short' })).toThrow();
  });
  it('accepts a database-free configuration', () => {
    expect(validateEnvironment(config)).toEqual(config);
  });
});
