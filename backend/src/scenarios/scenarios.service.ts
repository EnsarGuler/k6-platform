import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
// update-scenario.dto.ts'yi kullanmıyoruz

@Injectable()
export class ScenariosService {
  constructor(private prisma: PrismaService) {}

  // Yeni bir senaryo parçacığı oluştur
  create(createScenarioDto: CreateScenarioDto) {
    return this.prisma.scenario.create({
      data: createScenarioDto,
    });
  }

  // Tüm senaryo parçacıklarını listele
  findAll() {
    return this.prisma.scenario.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        // scriptFragment'ı listeye dahil etmeyelim, çok uzun olabilir
      },
    });
  }

  // (Diğer 'findOne', 'update', 'remove' fonksiyonlarını şimdilik silebiliriz)
}
