import type { Scenario } from "./types.js";
export const phishing: Scenario = {
  id: "phishing", title: "Unexpected Payroll Attachment", eyebrow: "Scenario 2 · Attachment safety",
  description: "An email contains a payroll spreadsheet and asks you to enable macros so the document can display correctly.",
  prompt: "What is the safest response to this attachment?",
  briefing: {
    title: "An unexpected payroll file arrives",
    scene: "A message claims a payroll correction is attached. The document asks you to enable macros before you can read it. Inspect the request and decide how to respond.",
    linkLabel: "Open: Updated payroll statement.xlsm",
    launchText: "Open the email"
  },
  actions: [
    { id: "enable-macros", label: "Open it and enable macros" },
    { id: "report-attachment", label: "Do not enable macros; verify and report it" }
  ],
  correctAction: "report-attachment",
  feedback: { correct: "Correct. Unexpected macro-enabled documents can run malicious code. Verify through a trusted channel and report the message.", incorrect: "Enabling macros in an unexpected attachment is unsafe. Verify the request independently and report the message instead." }
};
