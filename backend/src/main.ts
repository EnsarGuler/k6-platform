import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Gelen veriyi doğrula
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // YENİ EKLENEN SATIR:
  // Frontend'in (localhost:3001) bu backend'e (localhost:3000)
  // istek atmasına izin ver.
  app.enableCors({
    origin: 'http://localhost:3001',
  });

  // Backend'i 3000 portunda dinle (3001'de frontend çalışacak)
  // DİKKAT: Bizim 'app.listen(3000)' olan satırı 3001 yapmamız lazım!
  // Eğer seninki zaten 3000 ise, lütfen onu 3001 yap.
  await app.listen(3000);
}
bootstrap();
