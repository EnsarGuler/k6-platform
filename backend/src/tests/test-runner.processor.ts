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

    const tempDir = path.join(process.cwd(), 'temp');
    const scriptPath = path.join(tempDir, `${runId}.js`);
    const summaryPath = path.join(tempDir, `${runId}.json`);
    const realtimeLogPath = path.join(tempDir, `${runId}_live.json`); // Canlı log dosyası

    const k6ScriptContent = this.buildK6Script(
      test.options,
      test.scenarios,
      test.targetBaseUrl,
    );

    let tailInterval: NodeJS.Timeout;

    try {
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: 'RUNNING' },
      });
      await fs.writeFile(scriptPath, k6ScriptContent);

      // --- CANLI VERİ OKUMA DÖNGÜSÜ ---
      // Her 1 saniyede bir JSON dosyasının sonunu okuyup Frontend'e atacağız
      tailInterval = setInterval(async () => {
        try {
          const stats = await fs.stat(realtimeLogPath).catch(() => null);
          if (!stats) return;

          const content = await fs.readFile(realtimeLogPath, 'utf-8');
          const lines = content.trim().split('\n');

          // Son satırlardan "http_req_duration" metriğini bul
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const json = JSON.parse(lines[i]);
              // Sadece veri noktalarını al ve http_req_duration'a bak
              if (
                json.type === 'Point' &&
                json.metric === 'http_req_duration'
              ) {
                // Frontend'e gönder!
                this.eventsGateway.sendProgress(test.id, {
                  latency: json.data.value, // Gecikme süresi (ms)
                  time: new Date().toLocaleTimeString(),
                });
                break; // Son veriyi bulduk, döngüden çık
              }
            } catch (e) {}
          }
        } catch (err) {
          // Okuma hatası olursa sessiz kal
        }
      }, 1000);

      // k6 Çalıştır (--out json ile)
      await execa(
        'k6',
        [
          'run',
          scriptPath,
          '--summary-export',
          summaryPath,
          '--out',
          `json=${realtimeLogPath}`,
        ],
        { stdio: 'inherit' },
      );

      // Bitince temizlik
      clearInterval(tailInterval);

      const summaryContent = await fs.readFile(summaryPath, 'utf-8');
      const results = JSON.parse(summaryContent);

      await this.prisma.testRun.update({
        where: { id: runId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          resultSummary: results,
        },
      });

      // Bitiş sinyali
      this.eventsGateway.sendProgress(test.id, { type: 'FINISHED' });

      return { status: 'COMPLETED' };
    } catch (error) {
      clearInterval(tailInterval!); // Hata olsa bile döngüyü durdur
      this.logger.error(`Failed`, error.stack);
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: 'FAILED' },
      });
      throw error;
    } finally {
      try {
        await fs.unlink(scriptPath).catch(() => {});
        await fs.unlink(summaryPath).catch(() => {});
        await fs.unlink(realtimeLogPath).catch(() => {});
      } catch (e) {}
    }
  }

  // --- ESKİ YARDIMCI METODLAR AYNEN KALDI ---
  private buildK6Script(
    options: any,
    scenarios: any[],
    targetBaseUrl: string,
  ): string {
    let script = `import http from 'k6/http'; import { check, sleep } from 'k6'; const BASE_URL = '${targetBaseUrl}';`;
    for (const s of scenarios) script += `\n${s.scriptFragment}\n`;
    const k6Scenarios: any = {};
    for (const s of scenarios) {
      const funcName = this.extractFunctionName(s.scriptFragment);
      if (funcName) {
        k6Scenarios[this.createSafeName(s.name)] = {
          executor: 'constant-vus',
          ...options,
          exec: funcName,
        };
      }
    }
    script += `\nexport const options = { scenarios: ${JSON.stringify(k6Scenarios, null, 2)} };\n`;
    return script;
  }
  private extractFunctionName(f: string) {
    const m = f.match(/export function (\w+)\s*\(/);
    return m ? m[1] : null;
  }
  private createSafeName(n: string) {
    return n.replace(/ /g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  }
}
