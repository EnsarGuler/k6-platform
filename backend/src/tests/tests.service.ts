import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { InjectQueue } from '@nestjs/bull'; // 1. Kuyruğu enjekte etmek için
import type { Queue } from 'bull'; // 2. Kuyruğun tipi için

@Injectable()
export class TestsService {
  constructor(
    private prisma: PrismaService,

    // 3. "test-runner" kuyruğunu constructor'a enjekte et
    @InjectQueue('test-runner') private testRunnerQueue: Queue,
  ) {}

  // YENİ FONKSİYON: Bir testi çalıştırmak için tetikle
  async runTest(testId: string) {
    // 1. Adım: Testin var olup olmadığını kontrol et (opsiyonel ama iyi pratik)
    const testToRun = await this.prisma.test.findUnique({
      where: { id: testId },
    });
    if (!testToRun) {
      throw new Error('Test not found');
    }

    // 2. Adım: Veritabanına "Beklemede" durumunda yeni bir TestRun kaydı oluştur
    const newTestRun = await this.prisma.testRun.create({
      data: {
        testId: testId,
        status: 'PENDING', // Durumu "Beklemede" olarak ayarla
      },
    });

    // 3. Adım: Kuyruğa yeni bir iş ekle
    // Bu iş, testin tüm bilgilerini ve bu koşunun ID'sini taşır
    await this.testRunnerQueue.add('run-k6-test', {
      test: testToRun, // Testin ayarları (URL, vus, süre)
      runId: newTestRun.id, // Bu koşuya ait benzersiz ID
    });

    // 4. Adım: Kullanıcıya "İş kuyruğa alındı" mesajını ve runId'yi döndür
    return {
      message: 'Test run successfully queued.',
      runId: newTestRun.id,
      status: 'PENDING',
    };
  }

  // --- Eski fonksiyonlarımız ---
  create(createTestDto: CreateTestDto) {
    return this.prisma.test.create({
      data: createTestDto,
    });
  }

  findAll() {
    return this.prisma.test.findMany();
  }
}
