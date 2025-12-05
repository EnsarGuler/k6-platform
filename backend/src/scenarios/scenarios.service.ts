import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';

@Injectable()
export class ScenariosService {
  constructor(private prisma: PrismaService) {}

  create(createScenarioDto: CreateScenarioDto) {
    return this.prisma.scenario.create({
      data: createScenarioDto,
    });
  }

  findAll() {
    return this.prisma.scenario.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  }
}
