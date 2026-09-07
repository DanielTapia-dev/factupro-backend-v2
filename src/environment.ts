export function validateEnvironment(config: Record<string, unknown>) {
  if (typeof config.API_KEY !== 'string' || config.API_KEY.length < 32) {
    throw new Error('API_KEY must contain at least 32 characters');
  }
  if (
    Object.keys(config).some(
      (key) => key.startsWith('DB_') || key === 'DATABASE_URL',
    )
  ) {
    throw new Error('Identidades must not receive database configuration');
  }
  return config;
}
