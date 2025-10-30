import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  create(@Body() createTestDto: CreateTestDto) {
    return this.testsService.create(createTestDto);
  }

  @Get()
  findAll() {
    return this.testsService.findAll();
  }

  // Bu fonksiyon artık 'async' servisi çağırıyor
  @Post(':id/run')
  runTest(@Param('id') testId: string) {
    return this.testsService.runTest(testId);
  }
}
