// src/projects/projects.module.ts
import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaService } from 'src/prisma.service'; // 1. BU SATIRI EKLE

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService], // 2. 'PrismaService'İ BURAYA EKLE
})
export class ProjectsModule {}
