import { Controller, Get, Post, Body } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';

@Controller('scenarios') // Bu controller /scenarios yolunu dinler
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  // POST /scenarios
  @Post()
  create(@Body() createScenarioDto: CreateScenarioDto) {
    return this.scenariosService.create(createScenarioDto);
  }

  // GET /scenarios
  @Get()
  findAll() {
    // Frontend'in checkbox'ları doldurması için
    return this.scenariosService.findAll();
  }
}
