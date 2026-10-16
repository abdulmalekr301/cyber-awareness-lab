import type { Scenario } from "./types.js";
export const socialEngineering: Scenario = {
  id: "social-engineering", title: "A Message from ‘Event Support’", eyebrow: "Scenario 3 · Social engineering",
  description: "An external account claiming to be event support says your badge account is about to be locked and asks for the six-digit sign-in code sent to your phone.",
  prompt: "How would you respond to this conversation?",
  briefing: {
    title: "A support message appears during the event",
    scene: "You are waiting to enter a workshop when a new external contact messages you. They know the event name and say there is an urgent problem with your badge account.",
    linkLabel: "Teams · New message from Event Support",
    launchText: "Open conversation"
  },
  actions: [
    { id: "share-code", label: "Send the code before the account is locked" },
    { id: "verify-request", label: "Do not share it; contact support using the official event channel" },
    { id: "post-code", label: "Ask the event group whether the code belongs to support" }
  ],
  correctAction: "verify-request",
  feedback: { correct: "Correct. A sign-in code is an authentication secret. Real support should not ask you to send it. End the conversation and verify the issue through the official event channel.", incorrect: "Do not send or post a sign-in code. It can let another person complete a login as you. Contact support through the official event channel instead." }
};
