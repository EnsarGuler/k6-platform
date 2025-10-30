import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects') // Bu controller /projects yolundaki istekleri dinler
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // POST /projects isteği geldiğinde...
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    // İsteğin body'sini al ve service'e gönder
    return this.projectsService.create(createProjectDto);
  }

  // GET /projects isteği geldiğinde...
  @Get()
  findAll() {
    // Service'ten tüm projeleri iste
    return this.projectsService.findAll();
  }
}
