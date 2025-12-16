import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull'; // DÜZELTME: 'import type' ekledik ✅
import { Prisma } from '@prisma/client';

@Injectable()
export class TestsService {
  constructor(
    private prisma: PrismaService,
    // Burada @InjectQueue kullandığımız için runtime'da Queue sınıfına gerek yok,
    // NestJS 'test-runner' string'ine bakarak buluyor.
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
        name: name || `Test - ${new Date().toLocaleTimeString()}`,
        options: options as Prisma.InputJsonValue,
        targetBaseUrl: targetBaseUrl,
        project: {
          connectOrCreate: {
            where: { id: projectId || 'default-project' },
            create: {
              id: projectId || 'default-project',
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

    // Processor'a uygun veri formatı
    const processorCompatibleData = {
      ...testToRun,
      selectedScenarios: testToRun.scenarios.map((s) => ({ scenario: s })),
    };

    await this.testRunnerQueue.add('run-k6-test', {
      test: processorCompatibleData,
      runId: newTestRun.id,
    });

    return {
      message: 'Test run successfully queued.',
      runId: newTestRun.id,
      status: 'PENDING',
    };
  }

  // ... sınıfın içine ekle
  async getTestRun(runId: string) {
    const run = await this.prisma.testRun.findUnique({
      where: { id: runId },
      include: {
        test: true, // Hangi teste ait olduğunu da görelim
      },
    });

    if (!run) {
      throw new NotFoundException('Rapor bulunamadı.');
    }

    return run;
  }

  // ... sınıfın içine ekle
  async getAllRuns() {
    return this.prisma.testRun.findMany({
      include: {
        test: true, // Hangi teste ait olduğunu bilmek için
      },
      orderBy: {
        createdAt: 'desc', // En yenisi en başta olsun
      },
    });
  }

  async remove(id: string) {
    return this.prisma.test.delete({
      where: { id },
    });
  }
}
