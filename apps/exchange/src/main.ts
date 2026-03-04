import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create an application context (no HTTP server) for background worker-style service
  await NestFactory.createApplicationContext(AppModule);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Exchange service bootstrap failed', error);
  process.exit(1);
});

