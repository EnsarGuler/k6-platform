import { Module } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { ScenariosController } from './scenarios.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ScenariosController],
  providers: [ScenariosService, PrismaService],
})
export class ScenariosModule {}
