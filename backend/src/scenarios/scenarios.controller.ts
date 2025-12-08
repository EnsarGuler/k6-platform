import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';

@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Post()
  create(@Body() createScenarioDto: CreateScenarioDto) {
    return this.scenariosService.create(createScenarioDto);
  }

  @Get()
  findAll() {
    return this.scenariosService.findAll();
  }

  // GÜNCELLEME (PATCH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.scenariosService.update(id, updateData);
  }

  // SİLME (DELETE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scenariosService.remove(id);
  }
}
