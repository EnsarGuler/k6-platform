import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';

@Injectable()
export class ScenariosService {
  constructor(private prisma: PrismaService) {}

  // 1. EKLEME
  create(createScenarioDto: CreateScenarioDto) {
    return this.prisma.scenario.create({
      data: createScenarioDto,
    });
  }

  // 2. LİSTELEME
  findAll() {
    // En son eklenen en üstte görünsün diye ters çeviriyoruz (id ile veya createdAt varsa)
    return this.prisma.scenario.findMany();
  }

  // 3. GÜNCELLEME (YENİ)
  async update(id: string, updateData: any) {
    return this.prisma.scenario.update({
      where: { id },
      data: updateData,
    });
  }

  // 4. SİLME (YENİ)
  async remove(id: string) {
    return this.prisma.scenario.delete({
      where: { id },
    });
  }
}
