import type { Scenario } from "./types.js";
export const loginSafety: Scenario = {
  id: "login-safety", title: "The Look-Alike Login Portal", eyebrow: "Scenario 1 · Check the address",
  description: "A link opens a university-style sign-in portal. The page looks familiar, but its address has been subtly changed. This is a safe simulation—never enter a real password.",
  prompt: "Will you sign in, or stop and verify the official address?",
  briefing: {
    title: "Your university session has expired",
    scene: "You receive a message saying your university portal session has expired and that you must sign in again before you can access your courses.",
    linkLabel: "https://sms.u0t.edu.ly/eng/",
    launchText: "Open the sign-in link"
  },
  actions: [
    { id: "clean", label: "Clean" },
    { id: "hack", label: "Hack" }
  ],
  correctAction: "hack",
  feedback: { correct: "Correct. The page is a look-alike: the address is not the real university domain. Checking the exact URL is more reliable than trusting the page design.", incorrect: "This page is a look-alike. The key clue is the altered address rather than the familiar design." }
};
