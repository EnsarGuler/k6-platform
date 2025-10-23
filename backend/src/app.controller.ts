// backend/src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// 1. DÜZELTME:
// Dönecek verinin şeklini tarif eden bir 'interface' (kalıp) oluşturuyoruz.
// Diyoruz ki: "Bana 'now' adında bir özelliği olan ve tipi 'Date' (Tarih) olan bir obje gelecek"
interface DbTimeResult {
  now: Date;
}

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHello() {
    // 2. DÜZELTME:
    // $queryRaw komutuna, az önce oluşturduğumuz kalıbı <...> içinde veriyoruz.
    // "Bu sorgudan DbTimeResult tipinde bir DİZİ (Array) gelecek" demiş oluyoruz.
    const dbTimeResult = await this.prisma.$queryRaw<
      DbTimeResult[]
    >`SELECT NOW()`;

    // Artık TypeScript, 'dbTimeResult'ın tipini bildiği için
    // 'dbTimeResult[0].now' erişimine güvenle izin verir.
    return {
      message: 'Backend çalışıyor ve veritabanı bağlantısı başarılı!',
      databaseTime: dbTimeResult[0].now,
    };
  }
}
