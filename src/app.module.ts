import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TasksController } from './tasks.controller';
import { TaskRemindersService } from './task-reminders.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, TasksController],
  providers: [TaskRemindersService],
})
export class AppModule {}
