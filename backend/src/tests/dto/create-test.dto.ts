import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsArray,
  ArrayMinSize,
  IsUrl,
  IsOptional,
} from 'class-validator';

export class CreateTestDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Testin adı

  @IsString()
  @IsNotEmpty()
  projectId: string; // Hangi projeye ait olduğu

  @IsObject()
  @IsNotEmpty()
  options: Record<string, any>; // k6 'options' objesi (JSON)
  // Örn: { "vus": 10, "duration": "30s" }

  @IsArray()
  @IsString({ each: true }) // Dizideki her eleman string olmalı
  @ArrayMinSize(1) // En az bir senaryo seçilmeli
  selectedScenarioIds: string[]; // Seçilen senaryoların ID'leri

  @IsUrl()
  @IsOptional() // Boş gelmesine izin ver
  targetBaseUrl?: string;
}
