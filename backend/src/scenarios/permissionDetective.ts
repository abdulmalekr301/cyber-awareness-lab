import type { Scenario } from "./types.js";

export const permissionDetective: Scenario = {
  id: "permission-detective",
  title: "Permission Detective",
  eyebrow: "Scenario 5 · App permissions",
  description: "QuickCalc+, a fictional calculator, requests access to your microphone, contacts, and location before you can use it.",
  prompt: "What should you do before using this calculator?",
  briefing: {
    title: "Review a new calculator app",
    scene: "You need a simple calculator for a workshop. A permission sheet appears before installation. Inspect the access QuickCalc+ is requesting.",
    linkLabel: "QuickCalc+ · Review app permissions",
    launchText: "Review permissions",
  },
  actions: [
    { id: "allow-all", label: "Allow everything; the app might need it" },
    { id: "review-permissions", label: "Review the permissions and refuse unnecessary access" },
    { id: "install-unchecked", label: "Install without checking the permissions" },
    { id: "friend-test", label: "Send it to a friend to test first" },
  ],
  correctAction: "review-permissions",
  feedback: {
    correct: "Correct. Give apps only the access their function needs. Unnecessary permissions can expose private information.",
    incorrect: "Review what an app actually needs before granting access. A calculator should not need your microphone, contacts, or location.",
  },
};
