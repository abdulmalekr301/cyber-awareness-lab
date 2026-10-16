import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errors = new Rate("errors");
export const options = {
  scenarios: {
    participants: {
      executor: "per-vu-iterations",
      vus: 300,
      iterations: 1,
      maxDuration: "3m",
    },
  },
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<500"], errors: ["rate<0.01"] }
};
const base = __ENV.BASE_URL || "http://localhost";

export default function () {
  const create = http.post(`${base}/api/sessions`, JSON.stringify({ displayName: "Load Test Participant", telegramUsername: `@load_${__VU}_${__ITER}` }), { headers: { "Content-Type": "application/json" } });
  const created = check(create, { "session created": (r) => r.status === 201 }); errors.add(!created);
  if (!created) { sleep(1); return; }
  const code = create.json("sessionCode");
  for (let index = 0; index < 7; index += 1) {
    sleep(Math.random() * 2 + 0.5);
    const next = http.get(`${base}/api/sessions/${code}/scenario`);
    const loaded = check(next, { "scenario loaded": (r) => r.status === 200 }); errors.add(!loaded);
    if (!loaded) { sleep(1); return; }
    const scenario = next.json("scenario");
    const choice = scenario.actions[Math.floor(Math.random() * scenario.actions.length)].id;
    const payload = { scenarioId: scenario.id, selectedAction: choice, reason: "The request is unexpected; verify the sender and domain" };
    if (scenario.id === "permission-detective") payload.reason = "A calculator does not need my contacts or microphone";
    if (scenario.id === "ransomware") payload.reason = "Disconnecting stops malware spreading across the network";
    if (scenario.id === "wifi-trap") payload.reason = "An attacker can copy a network name, so I cannot trust the name alone";
    if (scenario.id === "login-safety") payload.reason = "The URL uses a different domain";
    const attempt = http.post(`${base}/api/sessions/${code}/attempts`, JSON.stringify(payload), { headers: { "Content-Type": "application/json" } });
    const saved = check(attempt, { "attempt saved": (r) => r.status === 200 }); errors.add(!saved);
    if (!saved) { sleep(1); return; }
  }
  const results = http.get(`${base}/api/sessions/${code}/results`);
  const complete = check(results, { "results returned": (r) => r.status === 200 && r.json("maximumScore") === 140 }); errors.add(!complete);
  sleep(Math.random() * 2);
}
