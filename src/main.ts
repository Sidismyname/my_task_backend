import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { TaskRemindersService } from './task-reminders.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  configureApp(app);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  app.get(TaskRemindersService).start();
  console.log(`API running at http://localhost:${port}/api`);
}

void bootstrap();
