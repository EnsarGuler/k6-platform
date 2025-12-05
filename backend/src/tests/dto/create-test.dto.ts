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
  name: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsObject()
  @IsNotEmpty()
  options: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  selectedScenarioIds: string[];

  @IsUrl()
  @IsOptional()
  targetBaseUrl?: string;
}
