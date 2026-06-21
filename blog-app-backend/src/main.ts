import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = new Set(env.CORS_ORIGINS);
  const corsOrigin = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  };

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Draft-Version',
    ],
    exposedHeaders: ['X-Draft-Version'],
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (env.SWAGGER_ENABLED) {
    const config = new DocumentBuilder()
      .setTitle('ScribePoint API')
      .setDescription('REST API documentation')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha' },
    });
  }

  await app.listen(env.PORT);

  const logger = new Logger('Bootstrap');
  logger.log(`Application running on http://localhost:${env.PORT}`);
  if (env.SWAGGER_ENABLED) {
    logger.log(`Swagger docs at http://localhost:${env.PORT}/docs`);
  }
}
bootstrap();
