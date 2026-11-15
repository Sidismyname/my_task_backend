require('reflect-metadata');
const { PrismaService } = require('../../dist/prisma/prisma.service.js');
const { TaskRemindersService } = require('../../dist/task-reminders.service.js');

exports.handler = async () => {
  const prisma = new PrismaService();
  try {
    await new TaskRemindersService(prisma).recordDueReminders();
    return { statusCode: 204, body: '' };
  } finally {
    await prisma.$disconnect();
  }
};
