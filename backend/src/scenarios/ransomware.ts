import type { Scenario } from "./types.js";

export const ransomware: Scenario = {
  id: "ransomware",
  title: "Ransomware: Save the Files",
  eyebrow: "Scenario 6 · Incident response",
  description: "A fictional university office computer suddenly shows a message saying its files are locked and demanding payment.",
  prompt: "What is the safest first response?",
  briefing: {
    title: "An unexpected warning interrupts your work",
    scene: "During a workshop, an office computer displays a file-lock warning. This is a safe simulation: no files or devices are affected.",
    linkLabel: "Training computer · View the warning",
    launchText: "View the warning",
  },
  actions: [
    { id: "isolate-report", label: "Disconnect the device from the network and report it to IT" },
    { id: "pay-ransom", label: "Pay the ransom immediately" },
    { id: "keep-working", label: "Ignore the warning and keep working" },
    { id: "restart-repeat", label: "Restart repeatedly until the warning disappears" },
  ],
  correctAction: "isolate-report",
  feedback: {
    correct: "Correct. Isolate the device from the network and contact IT promptly. Containment and reporting help limit harm; payment does not guarantee recovery.",
    incorrect: "Disconnect from the network and report the incident to IT. Avoid panic, payment, and repeated restarts; follow the response team's instructions.",
  },
};
