export type Scenario = { id: string; title: string; eyebrow: string; description: string; prompt: string; briefing: { title: string; scene: string; linkLabel: string; launchText: string }; actions: { id: string; label: string }[] };
export type ScenarioResponse = { scenario: Scenario; progress: number; totalScenarios: number; score: number };
export type AttemptResponse = { correct: boolean; choiceCorrect: boolean; justificationAccepted: boolean; scoreAwarded: number; feedback: string; progress: number; totalScenarios: number; totalScore: number; completed: boolean };
export type Stats = {
  totalSessions: number; activeSessions: number; completedSessions: number; completionPercentage: number; averageScore: number; maximumScore: number; averagePercentage: number;
  scenarios: { id: string; title: string; attempts: number; accuracy: number }[];
  commonIncorrectActions: { scenarioId: string; selectedAction: string; count: number }[];
};
export type AdminSessionDetail = {
  sessionCode: string; displayName: string | null; telegramUsername: string | null;
  scenarioVersion: number; totalScenarios: number; maximumScore: number;
  startedAt: string; completedAt: string | null; totalScore: number; completed: boolean;
  attempts: { scenarioId: string; selectedAction: string; reason: string | null; correct: boolean; score: number; createdAt: string }[];
};
