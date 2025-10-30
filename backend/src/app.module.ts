// backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { ProjectsModule } from './projects/projects.module';
import { TestsModule } from './tests/tests.module';
import { BullModule } from '@nestjs/bull';
import { ScenariosModule } from './scenarios/scenarios.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    ProjectsModule,
    TestsModule,
    ScenariosModule,
  ],

  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
