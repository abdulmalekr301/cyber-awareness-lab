import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../api";
import { Shell } from "../components/Shell";
import type { AttemptResponse, ScenarioResponse } from "../types";
import { EmailPhishingScenario } from "./EmailPhishingScenario";
import { MicrosoftComparisonScenario } from "./MicrosoftComparisonScenario";
import { PortalLoginScenario } from "./PortalLoginScenario";
import { ScenarioBriefing } from "./ScenarioBriefing";
import { AwarenessMiniGame } from "./AwarenessMiniGame";
import { SocialEngineeringScenario } from "./SocialEngineeringScenario";
import { localizeFeedback, localizeScenario, useLanguage } from "../i18n";

const scenarioRoutes: Record<string, string> = {
  "login-safety": "/simulation/portal/sms-u0t-training",
  phishing: "/simulation/inbox/security-alert",
  "social-engineering": "/simulation/support/conversation",
  "url-safety": "/simulation/microsoft/compare",
  "permission-detective": "/simulation/apps/permissions",
  ransomware: "/simulation/incident/files",
  "network-defender": "/simulation/network/monitor", // Existing version-2 sessions only.
  "wifi-trap": "/simulation/wifi/networks",
};

export function Simulation() {
  const navigate = useNavigate();
  const { language, isArabic } = useLanguage();
  const [data, setData] = useState<ScenarioResponse>();
  const [feedback, setFeedback] = useState<AttemptResponse>();
  const [launched, setLaunched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [choice, setChoice] = useState("");
  const [reason, setReason] = useState("");
  const code = localStorage.getItem("cyberlab_session");

  async function load() {
    if (!code) { navigate("/join", { replace: true }); return; }
    setLoading(true);
    setFeedback(undefined);
    setLaunched(false);
    setError("");
    setChoice("");
    setReason("");
    try {
      const nextData = await api<ScenarioResponse>(`/api/sessions/${code}/scenario`);
      setData(nextData);
      navigate(`/simulation/briefing/${nextData.scenario.id}`, { replace: true });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to load";
      if (message.includes("complete")) navigate("/results", { replace: true });
      else if (message.includes("not found")) {
        localStorage.removeItem("cyberlab_session");
        navigate("/", { replace: true });
      } else setError(message);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function answer(selectedAction: string, reason: string) {
    if (!data || !code) return;
    setLoading(true);
    setError("");
    try {
      setFeedback(await api(`/api/sessions/${code}/attempts`, {
        method: "POST",
        body: JSON.stringify({ scenarioId: data.scenario.id, selectedAction, reason }),
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to submit");
    } finally { setLoading(false); }
  }

  function launch() {
    if (!data) return;
    setLaunched(true);
    navigate(scenarioRoutes[data.scenario.id] ?? "/simulation/question", { replace: true });
  }

  function next() {
    if (feedback?.completed) navigate("/results"); else void load();
  }

  if (!data) return <Shell compact><div className="panel rounded-2xl p-8 text-center text-slate-400">{error || (isArabic ? "جارٍ تحميل المحاكاة…" : "Loading your simulation…")}</div></Shell>;
  const scenario = localizeScenario(data.scenario, language);
  const feedbackText = feedback ? localizeFeedback(data.scenario.id, feedback.correct, language, feedback.feedback, feedback.scoreAwarded) : "";
  if (!launched && !feedback) return <ScenarioBriefing scenario={scenario} number={data.progress + 1} total={data.totalScenarios} onLaunch={launch}/>;
  if (data.scenario.id === "login-safety") return <PortalLoginScenario onAction={answer} disabled={loading} feedback={feedback} onNext={next} error={error}/>;
  if (data.scenario.id === "phishing") return <EmailPhishingScenario onAction={answer} disabled={loading} feedback={feedback} onNext={next} error={error}/>;
  if (data.scenario.id === "social-engineering") return <SocialEngineeringScenario onAction={answer} disabled={loading} feedback={feedback} onNext={next} error={error}/>;
  if (data.scenario.id === "url-safety") return <MicrosoftComparisonScenario onAction={answer} disabled={loading} feedback={feedback} onNext={next} error={error} final={data.progress + 1 === data.totalScenarios}/>;
  if (["permission-detective", "ransomware", "network-defender", "wifi-trap"].includes(data.scenario.id)) return <AwarenessMiniGame key={data.scenario.id} scenario={data.scenario} number={data.progress + 1} total={data.totalScenarios} score={data.score} onAction={answer} disabled={loading} feedback={feedback} onNext={next} error={error}/>;

  const progress = ((feedback?.progress ?? data.progress) / data.totalScenarios) * 100;
  return <Shell compact>
    <div className="mb-6 flex items-end justify-between"><div><div className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">{isArabic ? `القرار ${(feedback?.progress ?? data.progress) + (feedback ? 0 : 1)} من ${data.totalScenarios}` : `Decision ${(feedback?.progress ?? data.progress) + (feedback ? 0 : 1)} of ${data.totalScenarios}`}</div><div className="mt-2 font-mono text-xs text-slate-500">{isArabic ? "الجلسة" : "Session"} {code}</div></div><div className={isArabic ? "text-left" : "text-right"}><div className="text-2xl font-black text-white">{feedback?.totalScore ?? data.score}<span className="text-sm text-slate-500"> / {data.totalScenarios * 20}</span></div><div className="text-xs text-slate-500">{isArabic ? "النتيجة الحالية" : "current score"}</div></div></div>
    <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-300 transition-all duration-500" style={{ width: `${progress}%` }}/></div>
    <article className="panel rounded-2xl p-5 sm:p-8">
      <div className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">{scenario.eyebrow}</div><h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{scenario.title}</h1><p className="mt-4 leading-7 text-slate-400">{scenario.description}</p>
      {feedback ? <div className={`mt-7 rounded-xl border p-5 ${feedback.scoreAwarded === 20 ? "border-emerald-400/25 bg-emerald-400/[.06]" : feedback.scoreAwarded === 10 ? "border-amber-300/25 bg-amber-300/[.06]" : "border-rose-400/25 bg-rose-400/[.06]"}`}><div className="flex items-center gap-3 font-bold text-white">{feedback.scoreAwarded === 20 ? <CheckCircle2 className="text-emerald-300"/> : <XCircle className={feedback.scoreAwarded === 10 ? "text-amber-300" : "text-rose-300"}/>} {feedback.scoreAwarded === 20 ? (isArabic ? "اختيار وتبرير صحيحان" : "Good decision and justification") : feedback.scoreAwarded === 10 ? (isArabic ? "الاختيار صحيح والتبرير ضعيف" : "Correct choice, weak justification") : (isArabic ? "ليس الخيار الأكثر أماناً" : "Not the safest choice")}<span className="ms-auto text-sm text-slate-400">+{feedback.scoreAwarded}</span></div><p className="mt-3 text-sm leading-6 text-slate-300">{feedbackText}</p><button onClick={next} className="focus-ring mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">{isArabic ? "السيناريو التالي" : "Next scenario"}<ArrowRight size={18} className={isArabic ? "rotate-180" : ""}/></button></div> : <><h2 className="mt-8 text-sm font-semibold text-slate-200">{scenario.prompt}</h2><div className="mt-4 grid gap-3">{scenario.actions.map((action, index) => <button key={action.id} disabled={loading} aria-pressed={choice === action.id} onClick={() => setChoice(action.id)} className={`focus-ring flex min-h-14 items-center gap-4 rounded-xl border px-4 text-start text-sm font-semibold transition disabled:opacity-50 ${choice === action.id ? "border-cyan-300 bg-cyan-300/15 text-white" : "border-slate-700/80 bg-slate-900/60 text-slate-200 hover:border-cyan-300/50 hover:bg-cyan-300/[.05]"}`}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-800 font-mono text-xs text-slate-400">{String.fromCharCode(65 + index)}</span>{action.label}</button>)}</div><textarea aria-label={isArabic ? "تبرير القرار" : "Decision justification"} value={reason} onChange={(event) => setReason(event.target.value.slice(0,240))} maxLength={240} rows={3} placeholder={isArabic ? "اكتب الدليل الأمني الذي يبرر اختيارك…" : "Identify the security evidence that justifies your choice…"} className="mt-4 w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"/><button type="button" onClick={() => void answer(choice, reason.trim())} disabled={loading || !choice || reason.trim().length < 3} className="mt-3 min-h-12 w-full rounded-xl bg-cyan-300 font-bold text-slate-950 disabled:opacity-40">{loading ? (isArabic ? "جارٍ فحص إجابتك…" : "Checking your answer…") : (isArabic ? "إرسال القرار" : "Submit decision")}</button></>}
      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
    </article>
  </Shell>;
}
