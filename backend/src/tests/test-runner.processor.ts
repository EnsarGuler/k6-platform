import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventsGateway } from 'src/events.gateway';

@Processor('test-runner')
export class TestRunnerProcessor {
  private readonly logger = new Logger(TestRunnerProcessor.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  @Process('run-k6-test')
  async handleRunK6Test(job: Job) {
    this.logger.log(`Processing job... Job ID: ${job.id}`);
    const { runId, test } = job.data;

    // Geçici dosya yolları
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (e) {}

    const scriptPath = path.join(tempDir, `${runId}.js`);
    const summaryPath = path.join(tempDir, `${runId}.json`);
    const realtimeLogPath = path.join(tempDir, `${runId}_live.json`);

    // 1. Scripti İnşa Et
    const k6ScriptContent = this.buildK6Script(
      test.options,
      test.selectedScenarios,
      test.targetBaseUrl,
    );

    // Debug için loga bas (İsteğe bağlı)
    this.logger.debug('Generated k6 Script Preview:\n' + k6ScriptContent);

    let tailInterval: NodeJS.Timeout | null = null;

    try {
      // Durumu RUNNING yap
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: 'RUNNING' },
      });

      await fs.writeFile(scriptPath, k6ScriptContent);

      // 2. Canlı Log İzleme (Polling)
      tailInterval = setInterval(async () => {
        try {
          const stats = await fs.stat(realtimeLogPath).catch(() => null);
          if (!stats) return;

          const content = await fs.readFile(realtimeLogPath, 'utf-8');
          const lines = content.trim().split('\n');

          // Sondan başa doğru en güncel logu bul
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const json = JSON.parse(lines[i]);
              if (
                json.type === 'Point' &&
                json.metric === 'http_req_duration'
              ) {
                this.eventsGateway.sendProgress(test.id, {
                  latency: json.data.value,
                  time: new Date().toLocaleTimeString(),
                });
                break;
              }
            } catch (e) {}
          }
        } catch (err) {}
      }, 1000);

      // 3. K6'yı Çalıştır
      // reject: false sayesinde, k6 threshold hatası (Exit code 99) verse bile catch bloğuna düşmez.
      // Kontrolü biz aşağıda yapacağız.
      const { exitCode } = await execa(
        'k6',
        [
          'run',
          scriptPath,
          '--summary-export',
          summaryPath,
          '--out',
          `json=${realtimeLogPath}`,
          '--insecure-skip-tls-verify',
        ],
        { stdio: 'inherit', reject: false },
      );

      if (tailInterval) clearInterval(tailInterval);

      // Sonuç dosyasını oku
      const summaryContent = await fs.readFile(summaryPath, 'utf-8');
      const results = JSON.parse(summaryContent);

      // 4. Durumu Belirle
      // Exit Code 0: Başarılı
      // Exit Code 99: Threshold Hatası (Test çalıştı ama hedefler tutmadı) -> FAILED olarak işaretleyebiliriz.
      // Diğerleri: Sistem Hatası
      let finalStatus = 'COMPLETED';

      if (exitCode === 99) {
        finalStatus = 'FAILED'; // Limitlere takıldı
      } else if (exitCode !== 0) {
        throw new Error(`k6 exited with error code: ${exitCode}`);
      }

      // Veritabanını Güncelle
      await this.prisma.testRun.update({
        where: { id: runId },
        data: {
          status: finalStatus,
          endedAt: new Date(),
          resultSummary: results,
        },
      });

      this.eventsGateway.sendProgress(test.id, { type: 'FINISHED' });
      return { status: finalStatus };
    } catch (error) {
      if (tailInterval) clearInterval(tailInterval);
      this.logger.error(`Test Execution Error: ${error.message}`);

      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: 'FAILED' },
      });
      // Kuyruğu tıkamamak için hata fırlatmıyoruz, sadece logluyoruz
      return { status: 'FAILED' };
    } finally {
      // Temizlik
      try {
        await fs.unlink(scriptPath).catch(() => {});
        await fs.unlink(summaryPath).catch(() => {});
        await fs.unlink(realtimeLogPath).catch(() => {});
      } catch (e) {}
    }
  }

  // --- K6 SCRIPT OLUŞTURUCU (NORMAL MOD) ---
  private buildK6Script(
    options: any,
    selectedScenarios: any[],
    targetBaseUrl: string,
  ): string {
    let script = `
import http from 'k6/http'; 
import { check, sleep } from 'k6'; 
const BASE_URL = '${targetBaseUrl}';
`;

    const k6ScenariosConfig: any = {};

    selectedScenarios.forEach((item, index) => {
      const scenario = item.scenario;
      const safeName = `scenario_${index}_${this.createSafeName(scenario.name)}`;

      // ✅ Regex Fix (Burası kritik, dokunmuyoruz):
      // "export default function" -> "export function Isim()" dönüşümü
      let fragment = scenario.scriptFragment.replace(
        /export\s+default\s+function\s*(\(\s*\))?/,
        `export function ${safeName}()`,
      );

      script += `\n// --- Scenario: ${scenario.name} ---\n${fragment}\n`;

      // Executor Mantığı: Grafik (stages) var mı yoksa sabit mi?
      const isRamping = options.stages && options.stages.length > 0;

      k6ScenariosConfig[safeName] = {
        executor: isRamping ? 'ramping-vus' : 'constant-vus',
        exec: safeName,
        ...options, // Frontend'den gelen ayarlar direkt geçer
      };
    });

    // ❌ Yapay Threshold'ları Sildik!
    // Artık sadece Frontend'den veya k6'nın kendi doğasından gelen sonuçlar geçerli.
    script += `
export const options = { 
  scenarios: ${JSON.stringify(k6ScenariosConfig, null, 2)},
  // Buraya elle 'thresholds' eklemiyoruz. Test doğal aksın.
};
`;
    return script;
  }

  private createSafeName(n: string) {
    return n.replace(/[^a-zA-Z0-9]/g, '_');
  }
}
