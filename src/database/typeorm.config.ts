import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

type ConfigReader = Pick<ConfigService, 'get'>;

const readEnv = (
  key: string,
  configService?: ConfigReader,
): string | undefined => configService?.get<string>(key) ?? process.env[key];

const readRequiredEnv = (
  key: string,
  configService?: ConfigReader,
): string => {
  const value = readEnv(key, configService);

  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const readPort = (configService?: ConfigReader): number => {
  const port = Number(readEnv('DB_PORT', configService) ?? 5432);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('DB_PORT must be a valid port number');
  }

  return port;
};

export const readBoolean = (
  key: string,
  configService?: ConfigReader,
  defaultValue = false,
): boolean => {
  const value = readEnv(key, configService);

  if (value === undefined || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase());
};

export const isDatabaseEnabled = (configService?: ConfigReader): boolean =>
  readBoolean('DB_ENABLED', configService);

export const getDataSourceOptions = (
  configService?: ConfigReader,
): DataSourceOptions => ({
  type: 'postgres',
  host: readEnv('DB_HOST', configService) ?? 'localhost',
  port: readPort(configService),
  username: readRequiredEnv('DB_USERNAME', configService),
  password: readRequiredEnv('DB_PASSWORD', configService),
  database: readRequiredEnv('DB_NAME', configService),
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  migrationsRun: readBoolean('DB_MIGRATIONS_RUN', configService),
});

export const getTypeOrmModuleOptions = (
  configService: ConfigReader,
): TypeOrmModuleOptions => ({
  ...getDataSourceOptions(configService),
  autoLoadEntities: true,
});
