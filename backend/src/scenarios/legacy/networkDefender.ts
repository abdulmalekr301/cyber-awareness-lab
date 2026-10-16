import type { Scenario } from "../types.js";

export const networkDefender: Scenario = {
  id: "network-defender",
  title: "Network Defender: Spot the Intruder",
  eyebrow: "Scenario 7 · Notice unusual patterns",
  description: "You are reviewing a fictional campus activity monitor. Choose the event that most urgently needs investigation.",
  prompt: "Which event should the security team investigate first?",
  briefing: {
    title: "Take a turn at the campus monitor",
    scene: "Most campus activity is routine. Review four simplified events and look for a pattern that stands out. No technical knowledge is needed.",
    linkLabel: "Campus security monitor · Review four events",
    launchText: "Review events",
  },
  actions: [
    { id: "known-login", label: "Student portal login from a known campus device" },
    { id: "university-download", label: "Course guide downloaded from the university website" },
    { id: "failed-login-burst", label: "45 failed logins in one minute from an unknown source" },
    { id: "library-browsing", label: "Normal browsing on a library workstation" },
  ],
  correctAction: "failed-login-burst",
  feedback: {
    correct: "Correct. A burst of failed logins from an unknown source deserves investigation. Analysts look for unusual patterns; an alert is a clue, not proof of a successful break-in.",
    incorrect: "Investigate the burst of failed logins first. Many failures from an unknown source can indicate someone repeatedly trying to gain access.",
  },
};
