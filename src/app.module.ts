import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CiudadanoModule } from './ciudadano/ciudadano.module';
import { HealthController } from './health.controller';
import { validateEnvironment } from './environment';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    CiudadanoModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
