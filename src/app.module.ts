import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { CiudadanoModule } from './ciudadano/ciudadano.module';
import {
  getTypeOrmModuleOptions,
  isDatabaseEnabled,
} from './database/typeorm.config';

config();

const databaseImports = isDatabaseEnabled()
  ? [
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getTypeOrmModuleOptions(configService),
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ...databaseImports,
    CiudadanoModule,
  ],
})
export class AppModule {}
