import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

interface DbTimeResult {
  now: Date;
}

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHello() {
    const dbTimeResult = await this.prisma.$queryRaw<
      DbTimeResult[]
    >`SELECT NOW()`;

    return {
      message: 'Backend çalışıyor ve veritabanı bağlantısı başarılı!',
      databaseTime: dbTimeResult[0].now,
    };
  }
}
