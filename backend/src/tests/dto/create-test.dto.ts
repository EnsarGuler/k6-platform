import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsInt,
  IsPositive,
} from 'class-validator';

export class CreateTestDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Testin adı

  @IsUrl() // Gelen verinin geçerli bir URL olduğundan emin ol
  @IsNotEmpty()
  targetUrl: string; // Örn: "https://api.example.com"

  @IsInt() // Gelen verinin bir tam sayı olduğundan emin ol
  @IsPositive() // Pozitif bir sayı olduğundan emin ol
  durationSec: number; // Saniye cinsinden süre

  @IsInt()
  @IsPositive()
  vus: number; // Sanal kullanıcı sayısı (Virtual Users)

  @IsString()
  @IsNotEmpty()
  projectId: string; // Bu testin ait olduğu projenin ID'si
}
