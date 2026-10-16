import type { Scenario } from "./types.js";

export const wifiTrap: Scenario = {
  id: "wifi-trap",
  title: "Wi-Fi Trap: Choose Your Network",
  eyebrow: "Scenario 7 · Wireless connections",
  description: "You arrive at a fictional university cybersecurity conference and want to connect to Wi-Fi. Several networks appear, but staff have not yet given you the verified network details.",
  prompt: "Which network would you be most cautious about connecting to without verification?",
  briefing: {
    title: "Compare the available networks",
    scene: "Your phone lists three campus-looking networks. Review their names and connection details, then choose the one you would be most cautious about without verification. All wireless information in this exercise is simulated.",
    linkLabel: "Wi-Fi settings · Available networks",
    launchText: "Review Wi-Fi options",
  },
  actions: [
    { id: "caution-campus", label: "Be most cautious about Campus_WiFi" },
    { id: "caution-guest-free", label: "Be most cautious about Campus_Guest_Free" },
    { id: "caution-campus-5g", label: "Be most cautious about Campus_WiFi_5G" },
  ],
  correctAction: "caution-guest-free",
  feedback: {
    correct: "Correct. Campus_Guest_Free deserves the most caution in this fictional situation because it offers unverified open access. That does not make it automatically malicious. A password-protected network is not automatically trustworthy, and familiar names can be impersonated. Before connecting to any of them in real life, verify the official network details through a trusted source such as authorized conference staff.",
    incorrect: "Campus_Guest_Free is the intended choice for the most caution here because its open access has not been verified; this does not prove it is malicious. Password protection and a familiar SSID do not prove legitimacy either. Approach all unverified public Wi-Fi carefully and confirm official network details through a trusted source before connecting.",
  },
};
