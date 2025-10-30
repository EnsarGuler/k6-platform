import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { PrismaService } from 'src/prisma.service';
import { BullModule } from '@nestjs/bull';
import { TestRunnerProcessor } from './test-runner.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'test-runner' })],
  controllers: [TestsController],
  providers: [TestsService, PrismaService, TestRunnerProcessor],
})
export class TestsModule {}
