import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Todas las rutas bajo /api/v1/*
  app.setGlobalPrefix('api/v1');

  const corsOrigin = process.env.CORS_ORIGIN ?? 'https://facturpro.herokuapp.com';
  const origin = corsOrigin.includes(',')
    ? corsOrigin.split(',').map((value) => value.trim())
    : corsOrigin;

  app.enableCors({
    origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'api-key'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('FactuPRO REST API')
    .setDescription('FactuPRO new version of backend')
    .setVersion('2.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  // Swagger quedará en /api/v1/docs
  SwaggerModule.setup('api/v1/docs', app, documentFactory);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`API on http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
