import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { schedule, type ScheduledTask } from 'node-cron';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class TaskRemindersService implements OnModuleDestroy {
  private readonly logger = new Logger(TaskRemindersService.name);
  private job?: ScheduledTask;

  constructor(private readonly prisma: PrismaService) {}

  start() {
    this.job ??= schedule('* * * * *', async () => {
      try {
        await this.recordDueReminders();
      } catch (error) {
        this.logger.error('Could not record task reminders.', error);
      }
    }, { noOverlap: true });
  }

  async onModuleDestroy() {
    await this.job?.destroy();
  }

  recordDueReminders() {
    return this.prisma.$executeRaw`
        UPDATE "tbl_task"
        SET "reminded_for" = "due_at"
        WHERE NOT "completed"
          AND "due_at" <= CURRENT_TIMESTAMP
          AND "reminded_for" IS DISTINCT FROM "due_at"
    `;
  }
}
