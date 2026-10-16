import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { currentScenarioVersion, scenarios, scenariosForVersion, toPublicScenario } from "./index.js";

const retained = JSON.parse(readFileSync(new URL("../../test-fixtures/retained-scenarios.json", import.meta.url), "utf8"));
describe("scenario contract", () => {
  it("replaces only scenario seven and retains a 140-point maximum", () => {
    expect(scenarios.map((item) => item.id)).toEqual(["login-safety", "phishing", "social-engineering", "url-safety", "permission-detective", "ransomware", "wifi-trap"]);
    expect(scenarios.length * 20).toBe(140);
    expect(currentScenarioVersion).toBe(4);
  });
  it("keeps all original definitions, answers and feedback unchanged", () => {
    expect(scenarios.slice(0, 4)).toEqual(retained);
    expect(scenariosForVersion(1)).toEqual(retained);
    expect(scenariosForVersion(4)).toEqual(scenarios);
    expect(scenariosForVersion(3).slice(0, 6)).toEqual(scenarios.slice(0, 6));
    expect(scenariosForVersion(3)[6].correctAction).toBe("verify-with-staff");
    expect(scenariosForVersion(2).slice(0, 6)).toEqual(scenarios.slice(0, 6));
    expect(scenariosForVersion(2)[6].id).toBe("network-defender");
  });
  it("keeps the entire first six scenario definitions unchanged", () => {
    const firstSix = JSON.parse(readFileSync(new URL("../../test-fixtures/retained-six-scenarios.json", import.meta.url), "utf8"));
    expect(scenarios.slice(0, 6)).toEqual(firstSix);
    expect(scenarios.map((scenario) => scenario.id)).not.toContain("network-defender");
  });
  it("never exposes answers in public scenario data", () => {
    for (const scenario of [...scenarios, scenariosForVersion(3)[6]]) {
      const publicValue = toPublicScenario(scenario) as Record<string, unknown>;
      expect(publicValue).not.toHaveProperty("correctAction");
      expect(publicValue).not.toHaveProperty("feedback");
      expect(publicValue).not.toHaveProperty("reasonChoices");
      expect(publicValue).not.toHaveProperty("evidenceRules");
      expect(publicValue).toHaveProperty("actions");
    }
  });
  it("asks for caution among exactly three networks without a fourth action", () => {
    const wifi = scenarios[6];
    expect(wifi.prompt).toBe("Which network would you be most cautious about connecting to without verification?");
    expect(wifi.actions).toEqual([
      { id: "caution-campus", label: "Be most cautious about Campus_WiFi" },
      { id: "caution-guest-free", label: "Be most cautious about Campus_Guest_Free" },
      { id: "caution-campus-5g", label: "Be most cautious about Campus_WiFi_5G" },
    ]);
    expect(wifi.correctAction).toBe("caution-guest-free");
  });
});
