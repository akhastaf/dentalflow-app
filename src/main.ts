import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   // set the prefix versioning 
//   app.enableVersioning({
//     type: VersioningType.URI,
//   });

//   // set swagger config
//   const config = new DocumentBuilder()
//     .setTitle('DentistFlow API')
//     .setDescription('API documentation for the DentistFlow SaaS application')
//     .setVersion('1.0')
//     // .addBearerAuth() // If you use Bearer token authentication
//     // .addTag('users', 'User management endpoints') // You can add tags for grouping
//     // .addTag('appointments', 'Appointment scheduling endpoints')
//     .build();
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api-docs', app, document); // Your Swagger UI will be at /api-docs
//   app.use(cookieParser())
//   app.setGlobalPrefix('api')
//   await app.listen(process.env.PORT ?? 3000);
//   console.log(`Application is running on: ${await app.getUrl()}`);
//   console.log(`Swagger documentation available at: ${await app.getUrl()}/api-docs`);
// }
// bootstrap();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend interaction
  app.enableCors({
    origin: true, // In production, specify your frontend's domain
    credentials: true,
  });

  // --- API Versioning ---
  // This enables URI-based versioning (e.g., /api/v1/auth)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // --- Cookie Parser ---
  // Enable cookie parsing for refresh tokens
  app.use(cookieParser());

  // --- Global Exception Filter ---
  app.useGlobalFilters(new HttpExceptionFilter());

  // --- Global Pipes ---
  // Automatically validate incoming data against DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints).join(', ');
          }
          return `${error.property} is invalid`;
        });
        return new BadRequestException(messages);
      },
    }),
  );

  // --- Swagger (OpenAPI) ---
  // Setup for API documentation
  const config = new DocumentBuilder()
    .setTitle('Your App API')
    .setDescription('The API documentation for your application.')
    .setVersion('1.0')
    .addBearerAuth() // Adds authorization support in Swagger UI
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();