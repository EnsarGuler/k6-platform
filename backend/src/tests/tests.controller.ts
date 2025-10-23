import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';

@Controller('tests') // Bu controller /tests yolunu dinler
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  // YENİ ENDPOINT: POST /tests/abc-123/run
  @Post(':id/run') // :id -> URL'den dinamik ID'yi alır
  runTest(@Param('id') testId: string) {
    // URL'den gelen testId'yi servise gönder
    return this.testsService.runTest(testId);
  }

  // POST /tests
  @Post()
  create(@Body() createTestDto: CreateTestDto) {
    return this.testsService.create(createTestDto);
  }

  // GET /tests
  @Get()
  findAll() {
    return this.testsService.findAll();
  }
}
