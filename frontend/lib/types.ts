export interface Scenario {
  id: string;
  name: string;
  description: string;
  scriptFragment: string;
}

export interface CreateScenarioDto {
  name: string;
  description: string;
  scriptFragment: string;
}
