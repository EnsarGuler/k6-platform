// backend/src/tests/test-runner.processor.ts

import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';

@Processor('test-runner')
export class TestRunnerProcessor {
  private readonly logger = new Logger(TestRunnerProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('run-k6-test')
  async handleRunK6Test(job: Job) {
    this.logger.log(`Processing job... Job ID: ${job.id}`);
    const { runId, test } = job.data;
    this.logger.log(`TestRun ID: ${runId}`);
    this.logger.log(`Running Test: ${test.name}`);

    const tempDir = path.join(process.cwd(), 'temp');
    const scriptPath = path.join(tempDir, `${runId}.js`);
    const summaryPath = path.join(tempDir, `${runId}.json`);

    const k6ScriptContent = this.buildK6Script(
      test.options,
      test.scenarios,
      test.targetBaseUrl,
    );

    try {
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: 'RUNNING' },
      });

      await fs.writeFile(scriptPath, k6ScriptContent);
      this.logger.log(`Temporary script file written to ${scriptPath}`);

      const k6Command = 'k6';
      const k6Args = ['run', scriptPath, '--summary-export', summaryPath];

      this.logger.log(`Executing k6 command: ${k6Command} ${k6Args.join(' ')}`);

      await execa(k6Command, k6Args, { stdio: 'inherit' });
      this.logger.log(`k6 execution finished.`);

      const summaryContent = await fs.readFile(summaryPath, 'utf-8');
      const results = JSON.parse(summaryContent);
      this.logger.log(`k6 summary file read successfully.`);

      await this.prisma.testRun.update({
        where: { id: runId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          resultSummary: results,
        },
      });

      this.logger.log(`Job processing COMPLETED. Job ID: ${job.id}`);
      return { status: 'COMPLETED' };
    } catch (error) {
      this.logger.error(
        `Job processing FAILED. Job ID: ${job.id}`,
        error.stack,
      );
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: 'FAILED', endedAt: new Date() },
      });
      throw error;
    } finally {
      try {
        await fs.unlink(scriptPath);
        await fs.unlink(summaryPath);
        this.logger.log(`Temporary files deleted.`);
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to delete temporary files for runId: ${runId}`,
        );
      }
    }
  }

  // --- GÜNCELLENMİŞ YARDIMCI FONKSİYONLAR ---

  private buildK6Script(
    options: any,
    scenarios: any[],
    targetBaseUrl: string,
  ): string {
    this.logger.log('Building k6 script from fragments...');

    let script = `
import http from 'k6/http';
import { sleep } from 'k6';
const BASE_URL = '${targetBaseUrl}';
`;

    for (const scenario of scenarios) {
      script += `\n${scenario.scriptFragment}\n`;
    }

    const k6Scenarios: Record<string, any> = {};
    for (const scenario of scenarios) {
      const funcName = this.extractFunctionName(scenario.scriptFragment);

      // HATA DÜZELTMESİ BURADA:
      // "User Login" gibi bir ismi "User_Login" gibi k6-güvenli bir isme çevir
      const safeScenarioName = this.createSafeName(scenario.name);

      if (funcName) {
        k6Scenarios[safeScenarioName] = {
          executor: 'ramping-vus',
          ...options,
          exec: funcName,
        };
      }
    }

    script += `\nexport const options = { scenarios: ${JSON.stringify(k6Scenarios, null, 2)} };\n`;

    this.logger.log('k6 script built successfully.');
    return script;
  }

  // k6'nın 'export function User_Login() { ... }' metninden
  // 'User_Login' ismini çıkaran basit bir yardımcı fonksiyon.
  private extractFunctionName(fragment: string): string | null {
    const match = fragment.match(/export function (\w+)\s*\(/);
    return match ? match[1] : null;
  }

  // YENİ YARDIMCI FONKSİYON:
  // k6'nın sevdiği (boşluksuz) bir isim oluşturur
  private createSafeName(name: string): string {
    // Tüm boşlukları alt tireye çevirir
    // k6'nın izin vermediği diğer karakterleri (harf, sayı, _, - dışında) kaldırır
    return name.replace(/ /g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  }
}
