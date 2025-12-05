import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class TestsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('test-runner') private testRunnerQueue: Queue,
  ) {}

  async create(createTestDto: CreateTestDto) {
    const { name, projectId, options, selectedScenarioIds, targetBaseUrl } =
      createTestDto;

    const scenarioConnections = selectedScenarioIds.map((id) => ({
      id: id,
    }));

    return this.prisma.test.create({
      data: {
        name: name,
        options: options,
        targetBaseUrl: targetBaseUrl,

        project: {
          connectOrCreate: {
            where: { id: projectId },
            create: {
              id: projectId,
              name: 'Varsayılan Proje',
            },
          },
        },

        scenarios: {
          connect: scenarioConnections,
        },
      },
    });
  }

  findAll() {
    return this.prisma.test.findMany({
      include: {
        scenarios: true,
        runs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async runTest(testId: string) {
    const testToRun = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        scenarios: true,
      },
    });

    if (!testToRun) {
      throw new NotFoundException('Test not found');
    }

    const newTestRun = await this.prisma.testRun.create({
      data: {
        testId: testId,
        status: 'PENDING',
      },
    });

    await this.testRunnerQueue.add('run-k6-test', {
      test: testToRun,
      runId: newTestRun.id,
    });

    return {
      message: 'Test run successfully queued.',
      runId: newTestRun.id,
      status: 'PENDING',
    };
  }
}
