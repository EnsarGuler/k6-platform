import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  // PrismaService'i kullanabilmek için buraya enjekte ediyoruz
  constructor(private prisma: PrismaService) {}

  // Yeni bir proje oluşturacak fonksiyon
  create(createProjectDto: CreateProjectDto) {
    // createProjectDto (örn: { "name": "Yeni Projem" })
    return this.prisma.project.create({
      data: createProjectDto,
    });
  }

  // Tüm projeleri listeleyecek fonksiyon
  findAll() {
    return this.prisma.project.findMany();
  }
}