import { scenariosForVersion } from "./scenarios/index.js";

type Attempt = { scenarioId: string; score: number; createdAt: Date };

// Historical attempts stay in storage. Only retained scenarios contribute to the
// current game, even if a legacy cached total or completion flag says otherwise.
export function currentSession<T extends { attempts: Attempt[]; completedAt: Date | null; scenarioVersion: number }>(session: T) {
  const scenarios = scenariosForVersion(session.scenarioVersion);
  const attempts = scenarios.flatMap((scenario) => session.attempts.filter((attempt) => attempt.scenarioId === scenario.id)) as T["attempts"];
  const completed = attempts.length === scenarios.length;
  return {
    ...session,
    attempts,
    totalScenarios: scenarios.length,
    maximumScore: scenarios.length * 20,
    totalScore: attempts.reduce((sum, attempt) => sum + attempt.score, 0),
    completed,
    completedAt: completed ? session.completedAt ?? attempts[attempts.length - 1].createdAt : null,
  };
}
