import { IsNotEmpty, IsString } from 'class-validator';

export class CreateScenarioDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Örn: "User Login"

  @IsString()
  @IsNotEmpty()
  description: string; // Örn: "Simulates a user logging into the system."

  @IsString()
  @IsNotEmpty()
  scriptFragment: string; // k6 fonksiyonunun kendisi
}
