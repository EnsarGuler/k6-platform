// DTO: Data Transfer Object (Veri Aktarım Objesi)
// Gelen isteğin body'sinin kalıbıdır.
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()     // "name" alanı string olmalı
  @IsNotEmpty()   // "name" alanı boş olmamalı
  name: string;
}