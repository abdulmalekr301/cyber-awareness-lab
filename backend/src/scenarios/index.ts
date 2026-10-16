import { phishing } from "./phishing.js";
import { loginSafety } from "./loginSafety.js";
import { urlSafety } from "./urlSafety.js";
import { socialEngineering } from "./socialEngineering.js";
import { permissionDetective } from "./permissionDetective.js";
import { ransomware } from "./ransomware.js";
import { networkDefender } from "./legacy/networkDefender.js";
import { wifiTrap } from "./wifiTrap.js";
import { legacyWifiTrap } from "./legacy/wifiTrap.js";
import type { PublicScenario, Scenario } from "./types.js";

export const scenarios: Scenario[] = [loginSafety, phishing, socialEngineering, urlSafety, permissionDetective, ransomware, wifiTrap];
const previousSevenScenarios = [...scenarios.slice(0, 6), networkDefender];
const previousWifiScenarios = [...scenarios.slice(0, 6), legacyWifiTrap];
export const currentScenarioVersion = 4;
export function scenariosForVersion(version: number) {
  if (version === 1) return scenarios.slice(0, 4);
  if (version === 2) return previousSevenScenarios;
  return version === 3 ? previousWifiScenarios : scenarios;
}
export const scenarioMap = new Map([...scenarios, networkDefender].map((scenario) => [scenario.id, scenario]));
export function toPublicScenario(scenario: Scenario): PublicScenario {
  const { correctAction: _answer, feedback: _feedback, ...safe } = scenario;
  return safe;
}
