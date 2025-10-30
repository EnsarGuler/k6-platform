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

  // YENİ 'create' FONKSİYONU (Hata Çözüldü)
  async create(createTestDto: CreateTestDto) {
    const { name, projectId, options, selectedScenarioIds, targetBaseUrl } =
      createTestDto;

    // DTO'dan gelen ID dizisini Prisma'nın 'connect' formatına çevir
    const scenarioConnections = selectedScenarioIds.map((id) => ({
      id: id,
    }));

    return this.prisma.test.create({
      data: {
        name: name,
        options: options, // JSON objesini doğrudan kaydet
        targetBaseUrl: targetBaseUrl,
        project: {
          connect: { id: projectId }, // Projeye bağla
        },
        scenarios: {
          connect: scenarioConnections, // Seçilen tüm senaryolara bağla
        },
      },
    });
  }

  // 'findAll' FONKSİYONU
  findAll() {
    return this.prisma.test.findMany({
      include: {
        scenarios: {
          select: { id: true, name: true }, // İlişkili senaryoların adını da al
        },
      },
    });
  }

  // 'runTest' FONKSİYONU
  async runTest(testId: string) {
    // Testi ve ilişkili senaryo parçacıklarını DB'den al
    const testToRun = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        scenarios: true, // Bu testin 'scriptFragment'lerini de al
      },
    });

    if (!testToRun) {
      throw new NotFoundException('Test not found');
    }

    // DB'ye 'PENDING' durumunda yeni bir TestRun kaydı oluştur
    const newTestRun = await this.prisma.testRun.create({
      data: {
        testId: testId,
        status: 'PENDING',
      },
    });

    // Kuyruğa iş ekle.
    // DİKKAT: Artık 'test' objesinin tamamını (script'leriyle) yolluyoruz.
    await this.testRunnerQueue.add('run-k6-test', {
      test: testToRun, // Tüm test verisi (options, scenarios, scriptFragments)
      runId: newTestRun.id,
    });

    return {
      message: 'Test run successfully queued.',
      runId: newTestRun.id,
      status: 'PENDING',
    };
  }
}
