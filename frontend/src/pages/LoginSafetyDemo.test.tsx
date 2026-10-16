import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Simulation } from "./Simulation";
import { PortalLoginScenario } from "./PortalLoginScenario";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("login safety simulation",()=>{
  it("never passes the dummy password to the action handler",async()=>{
    const user=userEvent.setup();const onAction=vi.fn();
    render(<PortalLoginScenario onAction={onAction} disabled={false} onNext={vi.fn()} error=""/>);
    const secret="THIS-MUST-NEVER-LEAVE-THE-BROWSER-93741";
    await user.type(screen.getByLabelText("Dummy password"),secret);
    await user.click(screen.getByRole("button",{name:"I am not a robot training checkbox"}));
    await waitFor(() => expect(screen.getByRole("button",{name:"Simulated portal login"})).toBeEnabled());
    await user.click(screen.getByRole("button",{name:/hack/i}));
    await user.type(screen.getByLabelText("What evidence supports your classification?"),"The URL is not the real domain");
    await user.click(screen.getByRole("button",{name:"Submit decision"}));
    expect(onAction).toHaveBeenCalledWith("hack","The URL is not the real domain");
    expect(JSON.stringify(onAction.mock.calls)).not.toContain(secret);
    expect(screen.getByText(/ليست بوابة الجامعة الحقيقية/)).toBeInTheDocument();
  });

  it("keeps the dummy password out of the API URL, headers, and body", async () => {
    const secret = "THIS-MUST-NEVER-LEAVE-THE-BROWSER-93741";
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const isAttempt = init?.method === "POST";
      return {
        ok: true,
        status: 200,
        json: async () => isAttempt
          ? { correct: false, scoreAwarded: 0, feedback: "Safe feedback", progress: 2, totalScenarios: 4, totalScore: 0, completed: false }
          : {
              scenario: {
                id: "login-safety",
                title: "Placeholder Login Safety Scenario",
                eyebrow: "Fictional sign-in",
                description: "Simulation only",
                prompt: "How should you respond?",
                briefing: { title: "Session expired", scene: "Open the portal", linkLabel: "https://sms.u0t.edu.ly/eng/", launchText: "Open sign-in link" },
                actions: [
                  { id: "clean", label: "Clean" },
                  { id: "hack", label: "Hack" },
                ],
              },
              progress: 1,
              totalScenarios: 4,
              score: 0,
            },
      } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("cyberlab_session", "CA-1234ABCD");

    const user = userEvent.setup();
    render(<MemoryRouter><Simulation /></MemoryRouter>);
    await user.click(await screen.findByRole("button", { name: "https://sms.u0t.edu.ly/eng/" }));
    await screen.findByLabelText("Dummy password");
    await user.type(screen.getByLabelText("Dummy password"), secret);
    await user.click(screen.getByRole("button", { name: /hack/i }));
    await user.type(screen.getByLabelText("What evidence supports your classification?"), "The link uses the wrong URL");
    await user.click(screen.getByRole("button", { name: "Submit decision" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [url, request] = fetchMock.mock.calls[1];
    expect(String(url)).not.toContain(secret);
    expect(JSON.stringify(request?.headers)).not.toContain(secret);
    expect(String(request?.body)).not.toContain(secret);
    expect(JSON.parse(String(request?.body))).toEqual({
      scenarioId: "login-safety",
      selectedAction: "hack",
      reason: "The link uses the wrong URL",
    });
  });
});
