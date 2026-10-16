export type ScenarioAction = { id: string; label: string };
export type Scenario = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  prompt: string;
  briefing: { title: string; scene: string; linkLabel: string; launchText: string };
  actions: ScenarioAction[];
  correctAction: string;
  feedback: { correct: string; incorrect: string };
};

export type PublicScenario = Omit<Scenario, "correctAction" | "feedback">;
