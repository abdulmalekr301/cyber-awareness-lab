import type { Scenario } from "../types.js";

export const legacyWifiTrap: Scenario = {
  id: "wifi-trap",
  title: "Wi-Fi Trap: Choose Your Network",
  eyebrow: "Scenario 7 · Wireless connections",
  description: "You arrive at a fictional university cybersecurity conference and want to connect to Wi-Fi. Several networks appear, but staff have not yet given you the verified network details.",
  prompt: "What is the safest action before connecting?",
  briefing: {
    title: "Choose how to get connected",
    scene: "Your phone lists several campus-looking networks. Review the available options and decide what to do before going online. All wireless information in this exercise is simulated.",
    linkLabel: "Wi-Fi settings · Available networks",
    launchText: "Review Wi-Fi options",
  },
  actions: [
    { id: "connect-campus", label: "Connect now to Campus_WiFi" },
    { id: "connect-free", label: "Connect now to Campus_Free_WiFi" },
    { id: "connect-official", label: "Connect now to Campus_WiFi_Official" },
    { id: "verify-with-staff", label: "Verify the official network information with conference staff before connecting" },
  ],
  correctAction: "verify-with-staff",
  feedback: {
    correct: "Correct. Ask authorized staff for the official name and connection instructions. Attackers can copy familiar Wi-Fi names (an ‘evil twin’). A password or strong signal does not prove identity; open Wi-Fi is not automatically malicious.",
    incorrect: "Check with authorized conference staff before connecting. Attackers can copy familiar Wi-Fi names. ‘Official’, a password, or a strong signal does not prove trust; an open network is not automatically malicious either.",
  },
};
