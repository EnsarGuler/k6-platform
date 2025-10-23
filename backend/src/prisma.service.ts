import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
async onModuleInit() {
    // Uygulama başlarken veritabanına bağlanmayı dene
    await this.$connect();
}
}