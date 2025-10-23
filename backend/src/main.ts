// backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // ValidationPipe'ı import et

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Gelen veriyi otomatik olarak DTO'daki tipe dönüştür
      whitelist: true, // DTO'da olmayan verileri otomatik olarak at
    }),
  );

  await app.listen(3000);
}
bootstrap();
