import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AwarenessMiniGame } from "./AwarenessMiniGame";
import { Simulation } from "./Simulation";
import { Results } from "./Results";
import { LanguageProvider, localizeScenario } from "../i18n";
import { permissionDetective } from "../../../backend/src/scenarios/permissionDetective";
import { ransomware } from "../../../backend/src/scenarios/ransomware";
import { networkDefender } from "../../../backend/src/scenarios/legacy/networkDefender";

import { wifiTrap } from "../../../backend/src/scenarios/wifiTrap";
import { legacyWifiTrap } from "../../../backend/src/scenarios/legacy/wifiTrap";

const games = [permissionDetective, ransomware, wifiTrap];
const reasons = [
  "A calculator does not need my contacts to add numbers",
  "Disconnecting stops malware spreading to other devices",
  "An attacker can copy a network name, so I cannot trust the name alone",
];
const arabicReasons = [
  "الحاسبة ما تحتاجش جهات الاتصال للحساب",
  "نفصل الشبكة لمنع انتشار البرمجية لباقي الاجهزة",
  "اسم الشبكة ممكن يتقلد من مهاجم",
];
const response = (data: unknown) => ({ ok: true, status: 200, json: async () => data }) as Response;
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals(); });

describe("new awareness games", () => {
  it.each(games.flatMap((game, index) => ["en", "ar"].map((language) => ({ game, index, language }))))("supports written reasoning for $game.id in $language", async ({ game, index, language }) => {
    localStorage.setItem("cyberlab_language", language);
    const onAction = vi.fn();
    render(<LanguageProvider><MemoryRouter><AwarenessMiniGame scenario={game} number={index + 5} total={7} score={80} onAction={onAction} disabled={false} onNext={vi.fn()} error=""/></MemoryRouter></LanguageProvider>);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "240");
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", language === "ar" ? "اشرح سبب اختيارك لهذه الإجابة..." : "Explain why you chose this answer...");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(index + 4));
    const submit = screen.getByRole("button", { name: language === "ar" ? "إرسال القرار" : "Submit decision" });
    expect(submit).toBeDisabled();
    const localized = localizeScenario(game, language === "ar" ? "ar" : "en");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: localized.actions.find((action) => action.id === game.correctAction)!.label }));
    expect(submit).toBeDisabled();
    const reason = language === "ar" ? arabicReasons[index] : reasons[index];
    await user.type(screen.getByRole("textbox"), reason);
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(onAction).toHaveBeenCalledWith(game.correctAction, reason);
  });

  it.each(games.map((game, index) => ({ game, index })))("resumes $game.id after refresh and continues to the next game or results", async ({ game, index }) => {
    localStorage.setItem("cyberlab_session", "CA-1234ABCD");
    const progress = index + 4;
    let answered = false;
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.endsWith("/results")) return response({ totalScore: 140, maximumScore: 140, sessionCode: "CA-1234ABCD", answers: Array.from({ length: 7 }, (_, i) => ({ scenarioId: `scenario-${i}`, correct: true, score: 20 })) });
      if (options?.method === "POST") {
        answered = true;
        return response({ correct: true, choiceCorrect: true, justificationAccepted: true, scoreAwarded: 20, feedback: game.feedback.correct, progress: progress + 1, totalScenarios: 7, totalScore: (progress + 1) * 20, completed: index === 2 });
      }
      return response({ scenario: answered && index < 2 ? games[index + 1] : game, progress: answered ? progress + 1 : progress, totalScenarios: 7, score: (answered ? progress + 1 : progress) * 20 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const app = () => <MemoryRouter initialEntries={[`/simulation/briefing/${game.id}`]}><Routes><Route path="/simulation/*" element={<Simulation/>}/><Route path="/results" element={<Results/>}/></Routes></MemoryRouter>;
    const mounted = render(app());
    await screen.findByRole("button", { name: game.briefing.linkLabel });
    mounted.unmount();
    render(app());
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: game.briefing.linkLabel }));
    await user.click(screen.getByRole("button", { name: game.actions.find((action) => action.id === game.correctAction)!.label }));
    await user.type(screen.getByRole("textbox"), reasons[index]);
    await user.click(screen.getByRole("button", { name: "Submit decision" }));
    await user.click(await screen.findByRole("button", { name: index === 2 ? "View results" : "Next scenario" }));
    if (index === 2) {
      expect(await screen.findByText("Simulation complete")).toBeInTheDocument();
      expect(screen.getByText("/140")).toBeInTheDocument();
    } else expect(await screen.findByRole("button", { name: games[index + 1].briefing.linkLabel })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock.mock.calls.every(([url]) => url.includes("CA-1234ABCD"))).toBe(true);
  });
});

describe("enhanced mini-game interaction", () => {
  it("shows the fictional phone, app icon, permission controls, and cosmetic calculator", async () => {
    const onAction = vi.fn();
    render(<MemoryRouter><AwarenessMiniGame scenario={permissionDetective} number={5} total={7} score={80} onAction={onAction} disabled={false} onNext={vi.fn()} error=""/></MemoryRouter>);
    expect(screen.getByLabelText("Fictional QuickCalc+ icon")).toBeInTheDocument();
    expect(screen.getByText("Requested permissions")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Preview 7" }));
    expect(screen.getByLabelText("Calculator display")).toHaveTextContent("7");
    await user.click(screen.getByRole("button", { name: "Clear preview" }));
    expect(screen.getByLabelText("Calculator display")).toHaveTextContent("0");
    await user.click(screen.getByText("Microphone"));
    expect(screen.getByText("Access the microphone to record audio.").closest("details")).toHaveAttribute("open");
    expect(onAction).not.toHaveBeenCalled();
  });

  it("shows a static monitor with uniformly styled events and selected details", async () => {
    render(<MemoryRouter><AwarenessMiniGame scenario={networkDefender} number={7} total={7} score={120} onAction={vi.fn()} disabled={false} onNext={vi.fn()} error=""/></MemoryRouter>);
    expect(screen.getByText("Fictional training data")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Sample activity varies/ })).toBeInTheDocument();
    const buttons = networkDefender.actions.map((action) => screen.getByRole("button", { name: action.label }));
    expect(new Set(buttons.map((button) => button.className)).size).toBe(1);
    const user = userEvent.setup();
    for (let index = 0; index < buttons.length; index++) {
      await user.click(buttons[index]);
      expect(buttons[index]).toHaveAttribute("aria-pressed", "true");
      expect(document.querySelector(".network-selected h3")).toHaveTextContent(networkDefender.actions[index].label);
    }
    expect(screen.getByRole("button", { name: "Submit decision" })).toBeDisabled();
  });

  it("retains the explanation across action changes, rerenders, language changes and tab refresh", async () => {
    localStorage.setItem("cyberlab_session", "CA-1234ABCD");
    const onAction = vi.fn();
    const view = () => <LanguageProvider><MemoryRouter><AwarenessMiniGame scenario={networkDefender} number={7} total={7} score={120} onAction={onAction} disabled={false} onNext={vi.fn()} error=""/></MemoryRouter></LanguageProvider>;
    const mounted = render(view());
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox"), reasons[2]);
    await user.click(screen.getByRole("button", { name: networkDefender.actions[0].label }));
    await user.click(screen.getByRole("button", { name: networkDefender.actions[2].label }));
    mounted.rerender(view());
    expect(screen.getByRole("textbox")).toHaveValue(reasons[2]);
    await user.click(screen.getByRole("button", { name: "التبديل إلى العربية" }));
    expect(screen.getByRole("textbox")).toHaveValue(reasons[2]);
    mounted.unmount();
    render(view());
    expect(screen.getByRole("textbox")).toHaveValue(reasons[2]);
    const action = localizeScenario(networkDefender, "ar").actions[2];
    expect(screen.getByRole("button", { name: action.label })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "إرسال القرار" }));
    expect(onAction).toHaveBeenCalledWith(action.id, reasons[2]);
  });

  it("rejects blank/non-letter drafts, enforces the length cap, and renders untrusted input as text", async () => {
    render(<MemoryRouter><AwarenessMiniGame scenario={ransomware} number={6} total={7} score={100} onAction={vi.fn()} disabled={false} onNext={vi.fn()} error=""/></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: ransomware.actions[0].label }));
    const textarea = screen.getByRole("textbox");
    for (const value of ["   ", "!!!", "123"]) {
      await user.clear(textarea);
      await user.type(textarea, value);
      expect(screen.getByRole("button", { name: "Submit decision" })).toBeDisabled();
    }
    await user.clear(textarea);
    await user.type(textarea, "<img src=x onerror=alert(1)>");
    expect(document.querySelector("[onerror]")).toBeNull();
    await user.clear(textarea);
    await user.click(textarea);
    await user.paste("a".repeat(260));
    expect((textarea as HTMLTextAreaElement).value.length).toBe(240);
  });

  it("does not restore another participant's draft and clears an accepted draft after feedback", async () => {
    localStorage.setItem("cyberlab_session", "CA-OTHER001");
    sessionStorage.setItem("cyberlab_draft_CA-1234ABCD_ransomware", JSON.stringify({ choice: "isolate-report", reason: reasons[1] }));
    const props = { scenario: ransomware, number: 6, total: 7, score: 100, onAction: vi.fn(), disabled: false, onNext: vi.fn(), error: "" };
    const mounted = render(<MemoryRouter><AwarenessMiniGame {...props}/></MemoryRouter>);
    expect(screen.getByRole("textbox")).toHaveValue("");
    mounted.rerender(<MemoryRouter><AwarenessMiniGame {...props} feedback={{ correct: true, choiceCorrect: true, justificationAccepted: true, scoreAwarded: 20, feedback: "Correct", progress: 6, totalScenarios: 7, totalScore: 120, completed: false }}/></MemoryRouter>);
    expect(sessionStorage.getItem("cyberlab_draft_CA-OTHER001_ransomware")).toBeNull();
  });
});

describe("Wi-Fi Trap interface", () => {
  it.each(["en", "ar"])("excludes the fourth action and rejects its saved draft selection in the active %s game", async (language) => {
    localStorage.setItem("cyberlab_language", language);
    localStorage.setItem("cyberlab_session", "CA-CURRENT4");
    sessionStorage.setItem("cyberlab_draft_CA-CURRENT4_wifi-trap", JSON.stringify({ choice: "verify-with-staff", reason: reasons[2] }));
    const onAction = vi.fn();
    render(<LanguageProvider><MemoryRouter><AwarenessMiniGame scenario={wifiTrap} number={7} total={7} score={120} onAction={onAction} disabled={false} onNext={vi.fn()} error=""/></MemoryRouter></LanguageProvider>);
    expect(screen.queryByText(/another available action/i)).toBeNull();
    expect(screen.queryByText("إجراء آخر متاح")).toBeNull();
    expect(screen.queryByRole("button", { name: /Verify the official network information/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /التأكد من معلومات الشبكة الرسمية مع موظفي المؤتمر/ })).toBeNull();
    expect(document.querySelector(".wifi-alternative, .wifi-staff-action")).toBeNull();
    expect(document.querySelectorAll(".wifi-lab button")).toHaveLength(3);
    expect(document.querySelectorAll('.wifi-lab [aria-pressed="true"]')).toHaveLength(0);
    expect(screen.getByRole("textbox")).toHaveValue(reasons[2]);
    const submit = screen.getByRole("button", { name: language === "ar" ? "إرسال القرار" : "Submit decision" });
    expect(submit).toBeDisabled();
    expect(JSON.parse(sessionStorage.getItem("cyberlab_draft_CA-CURRENT4_wifi-trap")!).choice).toBe("");
    const user = userEvent.setup();
    const localized = localizeScenario(wifiTrap, language === "ar" ? "ar" : "en");
    await user.click(screen.getByRole("button", { name: localized.actions[1].label }));
    await user.click(submit);
    expect(onAction).toHaveBeenCalledExactlyOnceWith("caution-guest-free", reasons[2]);
  });

  it.each(["en", "ar"])("renders only simulated networks and permits every action selection in %s", async (language) => {
    localStorage.setItem("cyberlab_language", language);
    const onAction = vi.fn();
    render(<LanguageProvider><MemoryRouter><AwarenessMiniGame scenario={wifiTrap} number={7} total={7} score={120} onAction={onAction} disabled={false} onNext={vi.fn()} error=""/></MemoryRouter></LanguageProvider>);
    const localized = localizeScenario(wifiTrap, language === "ar" ? "ar" : "en");
    expect(screen.getByRole("textbox", { name: language === "ar" ? "لماذا اخترت هذا الإجراء؟" : "Why did you choose this action?" })).toHaveAttribute("maxlength", "240");
    for (const name of ["Campus_WiFi", "Campus_Guest_Free", "Campus_WiFi_5G"]) expect(screen.getByText(name, { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: language === "ar" ? "أي شبكة ستكون أكثر حذراً من الاتصال بها دون التحقق منها؟" : "Which network would you be most cautious about connecting to without verification?" })).toBeInTheDocument();
    expect(document.querySelectorAll(".wifi-network")).toHaveLength(3);
    expect(localized.actions).toHaveLength(3);
    expect(document.querySelector(".wifi-staff-action")).toBeNull();
    expect(document.querySelector(".wifi-alternative")).toBeNull();
    expect(document.querySelectorAll(".wifi-lab button")).toHaveLength(3);
    expect(new Set(Array.from(document.querySelectorAll(".wifi-network")).map((button) => button.className)).size).toBe(1);
    expect(document.querySelectorAll(".wifi-network__signal")).toHaveLength(3);
    expect(document.querySelectorAll(".wifi-network__signal svg")).toHaveLength(3);
    expect(document.querySelectorAll(".wifi-network__signal > span")).toHaveLength(0);
    const icons = Array.from(document.querySelectorAll(".wifi-network__signal svg"));
    expect(icons[0]).toHaveClass("lucide-wifi-high");
    expect(icons[1]).toHaveClass("lucide-wifi");
    expect(icons[2]).toHaveClass("lucide-wifi-low");
    for (const strength of [3, 4, 2]) expect(screen.getByRole("img", { name: language === "ar" ? `قوة الإشارة ${strength} من 4` : `Signal strength ${strength} of 4` })).toBeInTheDocument();
    expect(screen.getAllByText(language === "ar" ? "تحتاج كلمة مرور" : "Password required")).toHaveLength(2);
    expect(screen.getByText(language === "ar" ? "لا تحتاج كلمة مرور" : "No password required")).toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeNull();
    const user = userEvent.setup();
    const reason = language === "ar" ? arabicReasons[2] : reasons[2];
    await user.type(screen.getByRole("textbox"), reason);
    for (const action of localized.actions) {
      await user.click(screen.getByRole("button", { name: action.label }));
      expect(screen.getByRole("button", { name: action.label })).toHaveAttribute("aria-pressed", "true");
      expect(document.querySelectorAll('.wifi-network[aria-pressed="true"]')).toHaveLength(1);
      expect(screen.getByRole("textbox")).toHaveValue(reason);
      expect(screen.getByRole("button", { name: language === "ar" ? "إرسال القرار" : "Submit decision" })).toBeEnabled();
    }
    expect(onAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: localized.actions[1].label }));
    expect(document.querySelector(".wifi-selection-summary p")).toHaveTextContent("Campus_Guest_Free");
    await user.click(screen.getByRole("button", { name: language === "ar" ? "إرسال القرار" : "Submit decision" }));
    expect(onAction).toHaveBeenCalledWith("caution-guest-free", reason);
  });

  it("restores Wi-Fi selection and reasoning after refresh and rejects a blank explanation", async () => {
    localStorage.setItem("cyberlab_session", "CA-WIFI0001");
    const props = { scenario: wifiTrap, number: 7, total: 7, score: 120, onAction: vi.fn(), disabled: false, onNext: vi.fn(), error: "" };
    const mounted = render(<MemoryRouter><AwarenessMiniGame {...props}/></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: wifiTrap.actions[1].label }));
    for (const value of ["   ", "!!!", "123", "ab"]) {
      await user.clear(screen.getByRole("textbox"));
      await user.type(screen.getByRole("textbox"), value);
      expect(screen.getByRole("button", { name: "Submit decision" })).toBeDisabled();
    }
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), reasons[2]);
    mounted.unmount();
    render(<MemoryRouter><AwarenessMiniGame {...props}/></MemoryRouter>);
    expect(screen.getByRole("button", { name: wifiTrap.actions[1].label })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox")).toHaveValue(reasons[2]);
  });

  it.each(["en", "ar"])("retains the version-3 question, draft and fourth action in %s", async (language) => {
    localStorage.setItem("cyberlab_language", language);
    localStorage.setItem("cyberlab_session", "CA-OLDWIFI3");
    sessionStorage.setItem("cyberlab_draft_CA-OLDWIFI3_wifi-trap", JSON.stringify({ choice: "verify-with-staff", reason: reasons[2] }));
    const onAction = vi.fn();
    render(<LanguageProvider><MemoryRouter><AwarenessMiniGame scenario={legacyWifiTrap} number={7} total={7} score={120} onAction={onAction} disabled={false} onNext={vi.fn()} error=""/></MemoryRouter></LanguageProvider>);
    const localized = localizeScenario(legacyWifiTrap, language === "ar" ? "ar" : "en");
    expect(screen.getByRole("heading", { name: language === "ar" ? "ما الإجراء الأكثر أماناً قبل الاتصال؟" : "What is the safest action before connecting?" })).toBeInTheDocument();
    expect(screen.getByText("Campus_Free_WiFi", { exact: true })).toBeInTheDocument();
    expect(screen.queryByText("Campus_Guest_Free", { exact: true })).toBeNull();
    expect(document.querySelectorAll(".wifi-lab button")).toHaveLength(4);
    expect(screen.getByRole("button", { name: localized.actions[3].label })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox")).toHaveValue(reasons[2]);
    await userEvent.setup().click(screen.getByRole("button", { name: language === "ar" ? "إرسال القرار" : "Submit decision" }));
    expect(onAction).toHaveBeenCalledWith("verify-with-staff", reasons[2]);
  });

  it.each(["en", "ar"])("displays the caution lesson after partial credit in %s", (language) => {
    localStorage.setItem("cyberlab_language", language);
    render(<LanguageProvider><MemoryRouter><AwarenessMiniGame scenario={wifiTrap} number={7} total={7} score={120} onAction={vi.fn()} disabled={false} onNext={vi.fn()} error="" feedback={{ correct: false, choiceCorrect: true, justificationAccepted: false, scoreAwarded: 10, feedback: `Your action is correct. Half credit was awarded. ${wifiTrap.feedback.correct}`, progress: 7, totalScenarios: 7, totalScore: 130, completed: true }}/></MemoryRouter></LanguageProvider>);
    expect(screen.getByText(language === "ar" ? /خذيت نصف النقاط/ : /Half credit was awarded/)).toHaveTextContent("Campus_Guest_Free");
    expect(screen.getByText(language === "ar" ? /خذيت نصف النقاط/ : /Half credit was awarded/)).toHaveTextContent(language === "ar" ? "هذا لا يجعلها خبيثة تلقائياً" : "not automatically trustworthy");
    expect(document.querySelectorAll(".wifi-network:disabled")).toHaveLength(3);
  });
});
