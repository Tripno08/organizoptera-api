import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TenantScopeInterceptor } from './common/interceptors/tenant-scope.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global tenant scope interceptor (RLS enforcement)
  app.useGlobalInterceptors(new TenantScopeInterceptor());

  // Health check endpoint (no prefix)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', (_req: unknown, res: { json: (data: unknown) => void }) => {
    res.json({ status: 'ok', service: 'organizoptera-api', timestamp: new Date().toISOString() });
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  const corsEnabled = process.env.CORS_ENABLED === 'true';
  if (corsEnabled) {
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    });
  }

  // API prefix
  const apiPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Swagger setup
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Organizoptera API')
      .setDescription('REST API for Organizoptera - Multi-Tenant Organization Management')
      .setVersion('1.0')
      .addTag('school-networks', 'School network operations')
      .addTag('schools', 'School operations')
      .addTag('grades', 'Grade operations')
      .addTag('classrooms', 'Classroom operations')
      .addTag('students', 'Student operations')
      .addTag('teachers', 'Teacher operations')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const swaggerPath = process.env.SWAGGER_PATH || 'docs';
    SwaggerModule.setup(swaggerPath, app, document);
  }

  const port = process.env.PORT || 5001;
  await app.listen(port);

  console.log(`🚀 Organizoptera API is running on: http://localhost:${port}/${apiPrefix}`);
  if (swaggerEnabled) {
    console.log(`📚 Swagger documentation: http://localhost:${port}/${process.env.SWAGGER_PATH || 'docs'}`);
  }
}

bootstrap();
