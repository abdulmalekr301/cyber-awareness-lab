import type { Scenario } from "./types.js";
export const urlSafety: Scenario = {
  id: "url-safety", title: "Unexpected MFA Approval", eyebrow: "Scenario 4 · Authentication fatigue",
  description: "Your phone shows an MFA approval request even though you are not signing in. A caller claiming to be support asks you to approve it.",
  prompt: "How should you respond to the unexpected approval request?",
  briefing: {
    title: "Your authenticator starts prompting",
    scene: "Several approval prompts appear on your phone. You did not initiate a sign-in, and someone claiming to be IT calls to ask you to approve the latest request.",
    linkLabel: "Authenticator notification: Approve sign-in?",
    launchText: "Review the approval request"
  },
  actions: [
    { id: "approve-request", label: "Approve it so support can finish" },
    { id: "deny-and-report", label: "Deny it, change the password, and report it" }
  ],
  correctAction: "deny-and-report",
  feedback: { correct: "Correct. An unexpected MFA prompt may mean someone already has the password. Deny it, secure the account, and contact support through an official channel.", incorrect: "Never approve an MFA request you did not initiate. Deny it, secure the account, and report the incident through an official channel." }
};
