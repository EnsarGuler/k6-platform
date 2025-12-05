import { IsNotEmpty, IsString } from 'class-validator';

export class CreateScenarioDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  scriptFragment: string;
}
