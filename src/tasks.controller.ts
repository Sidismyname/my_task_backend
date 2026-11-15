import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Prisma, TaskPriority } from './generated/prisma/client';
import { PrismaService } from './prisma/prisma.service';

function taskData(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Provide a task object.');
  }
  const { title, description, dueAt, priority, completed } = body as Record<string, unknown>;
  if (completed !== undefined && typeof completed !== 'boolean') {
    throw new BadRequestException('Completed must be true or false.');
  }
  if (typeof title !== 'string' || !title.trim()) {
    throw new BadRequestException('Title is required.');
  }
  if (typeof dueAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dueAt) ||
      !Number.isFinite(Date.parse(dueAt)) || new Date(dueAt).toISOString() !== dueAt) {
    throw new BadRequestException('Date and time must be a valid UTC timestamp.');
  }
  if (description != null && typeof description !== 'string') {
    throw new BadRequestException('Description must be text.');
  }
  if (priority != null && priority !== TaskPriority.LOW &&
      priority !== TaskPriority.MEDIUM && priority !== TaskPriority.HIGH) {
    throw new BadRequestException('Choose Low, Medium, or High priority.');
  }
  return {
    title: title.trim(),
    description: description?.trim() || null,
    dueAt: new Date(dueAt),
    priority: priority ?? null,
    completed,
  };
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query('q') query: unknown) {
    if (query !== undefined && typeof query !== 'string') {
      throw new BadRequestException('Provide one search term.');
    }
    const term = query?.trim().replace(/[\\%_]/g, '\\$&');
    return this.prisma.task.findMany({
      where: term ? {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found.');
    return task;
  }

  @Post()
  create(@Body() body: unknown) {
    return this.prisma.task.create({ data: taskData(body) });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    try {
      return await this.prisma.task.update({ where: { id }, data: taskData(body) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Task not found.');
      }
      throw error;
    }
  }

  @Patch(':id/completion')
  async complete(@Param('id') id: string, @Body('completed') completed: unknown) {
    if (typeof completed !== 'boolean') {
      throw new BadRequestException('Completed must be true or false.');
    }
    const result = await this.prisma.task.updateMany({ where: { id }, data: { completed } });
    if (!result.count) throw new NotFoundException('Task not found.');
    return { completed };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const result = await this.prisma.task.deleteMany({ where: { id } });
    if (!result.count) throw new NotFoundException('Task not found.');
  }
}
