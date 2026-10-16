import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./Landing";
import { Simulation } from "./Simulation";
import { Results } from "./Results";
import { LanguageProvider } from "../i18n";

const scenario = {
  id: "url-safety", title: "Unrequested approval", eyebrow: "Scenario 4", description: "Unexpected MFA", prompt: "How do you respond?",
  briefing: { title: "Review the notification", scene: "An unexpected request", linkLabel: "Authenticator", launchText: "Review notification" },
  actions: [{ id: "approve-request", label: "Approve" }, { id: "deny-and-report", label: "Deny" }],
};
const response = (data: unknown) => ({ ok: true, status: 200, json: async () => data }) as Response;
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

describe("conference registration and completion", () => {
  it.each(["en", "ar"])("registers directly with only retained fields in %s", async (language) => {
    localStorage.setItem("cyberlab_language", language);
    const fetchMock = vi.fn(async () => response({ sessionCode: "CA-1234ABCD", completed: false }));
    vi.stubGlobal("fetch", fetchMock);
    render(<LanguageProvider><MemoryRouter><Routes><Route path="/" element={<Landing/>}/><Route path="/simulation" element={<p>Game opened</p>}/></Routes></MemoryRouter></LanguageProvider>);
    const inputs = document.querySelectorAll("input");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute("autocomplete", "name");
    expect(inputs[0]).toHaveAttribute("maxlength", "80");
    expect(inputs[1]).toHaveAttribute("pattern", "@?[A-Za-z0-9_]{5,32}");
    expect(inputs[1]).toHaveAttribute("maxlength", "33");
    expect(inputs[1]).toBeRequired();
    expect(document.querySelector('input[type="email"], input[autocomplete="one-time-code"], input[type="checkbox"]')).toBeNull();
    const user = userEvent.setup();
    await user.type(inputs[0], "  Jane   Smith  ");
    await user.type(inputs[1], "@test_user");
    await user.click(screen.getByRole("button", { name: language === "ar" ? "ابدأ التدريب" : "Begin assessment" }));
    expect(await screen.findByText("Game opened")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/sessions");
    expect(JSON.parse(String(options.body))).toEqual({ displayName: "Jane Smith", telegramUsername: "@test_user" });
    expect(localStorage.getItem("cyberlab_session")).toBe("CA-1234ABCD");
  });

  it("preserves name validation before making a registration request", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    render(<MemoryRouter><Landing/></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Your name"), "12345");
    await user.type(screen.getByPlaceholderText("@yourusername"), "@test_user");
    await user.click(screen.getByRole("button", { name: "Begin assessment" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid name using 2 to 80 letters.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resumes the fourth scenario after refresh and transitions to results", async () => {
    localStorage.setItem("cyberlab_session", "CA-1234ABCD");
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.endsWith("/results")) return response({ sessionCode: "CA-1234ABCD", totalScore: 60, maximumScore: 80, answers: ["login-safety", "phishing", "social-engineering", "url-safety"].map((scenarioId) => ({ scenarioId, correct: true, score: 20 })) });
      if (options?.method === "POST") return response({ correct: true, choiceCorrect: true, justificationAccepted: true, scoreAwarded: 20, feedback: "Correct", progress: 4, totalScenarios: 4, totalScore: 60, completed: true });
      return response({ scenario, progress: 3, totalScenarios: 4, score: 40 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const view = () => <MemoryRouter initialEntries={["/simulation/microsoft/compare"]}><Routes><Route path="/simulation/*" element={<Simulation/>}/><Route path="/results" element={<Results/>}/></Routes></MemoryRouter>;
    const mounted = render(view());
    expect(await screen.findByRole("button", { name: "Authenticator" })).toBeInTheDocument();
    mounted.unmount();
    render(view());
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Authenticator" }));
    await user.click(screen.getByRole("button", { name: /Deny, secure the account/ }));
    await user.type(screen.getByLabelText("What in the situation supports your decision?"), "I did not initiate this sign in request");
    await user.click(screen.getByRole("button", { name: "Submit decision" }));
    await user.click(await screen.findByRole("button", { name: "View results" }));
    expect(await screen.findByText("Simulation complete")).toBeInTheDocument();
    expect(screen.getByText("/80")).toBeInTheDocument();
    expect(screen.getByText("Strong security instincts")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock.mock.calls.every(([url]) => url.includes("CA-1234ABCD"))).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => /training-email|email-verifications/.test(url))).toBe(false);
  });
});
