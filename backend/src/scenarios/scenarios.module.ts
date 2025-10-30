import { Module } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { ScenariosController } from './scenarios.controller';
import { PrismaService } from 'src/prisma.service'; // 1. BU SATIRI EKLE

@Module({
  controllers: [ScenariosController],
  providers: [ScenariosService, PrismaService], // 2. 'PrismaService'İ BURAYA EKLE
})
export class ScenariosModule {}
