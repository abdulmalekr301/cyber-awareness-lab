import { useCallback, useEffect, useState } from "react";
import { Activity, BarChart3, CheckCircle2, ChevronDown, ChevronUp, ListChecks, LogOut, RefreshCw, Shield, XCircle } from "lucide-react";
import { api } from "../api";
import { Shell } from "../components/Shell";
import type { AdminSessionDetail, Stats } from "../types";
import { useLanguage } from "../i18n";

const scenarioNames: Record<string, string> = {
  "login-safety": "University portal",
  phishing: "Email phishing",
  "social-engineering": "Support request",
  "url-safety": "Unexpected MFA approval",
  "permission-detective": "Permission Detective",
  ransomware: "Ransomware: Save the Files",
  "wifi-trap": "Wi-Fi Trap: Choose Your Network",
  "network-defender": "Network Defender (earlier sessions)",
};

export function Admin() {
  const { isArabic } = useLanguage();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<Stats>();
  const [sessions, setSessions] = useState<AdminSessionDetail[]>([]);
  const [expanded, setExpanded] = useState<string>();
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextStats, nextSessions] = await Promise.all([
        api<Stats>("/api/admin/stats"),
        api<AdminSessionDetail[]>("/api/admin/sessions"),
      ]);
      setStats(nextStats);
      setSessions(nextSessions);
      setAuthenticated(true);
      setError("");
    } catch (reason) {
      if (!authenticated) setAuthenticated(false); else setError(reason instanceof Error ? reason.message : "Unable to refresh");
    }
  }, [authenticated]);

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (!authenticated) return; const timer = setInterval(() => void load(), 5000); return () => clearInterval(timer); }, [authenticated, load]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setAuthenticated(true);
      setTimeout(() => void load(), 0);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Login failed"); }
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST", body: "{}" });
    setAuthenticated(false);
    setStats(undefined);
    setSessions([]);
  }

  if (!authenticated) return <Shell compact><form onSubmit={login} className="panel mx-auto max-w-md rounded-2xl p-7 sm:p-9"><div className="grid size-12 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><Shield/></div><h1 className="mt-6 text-2xl font-bold text-white">{isArabic ? "دخول المسؤول" : "Administrator access"}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{isArabic ? "عرض بيانات المشاركين وإجاباتهم ونتائجهم." : "View participant details, answers, and scores."}</p><label className="mt-7 block text-sm font-semibold text-slate-300">{isArabic ? "كلمة مرور المسؤول" : "Admin password"}<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4" required/></label><button className="focus-ring mt-4 min-h-12 w-full rounded-lg bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">{isArabic ? "تسجيل الدخول" : "Sign in"}</button>{error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}</form></Shell>;
  if (!stats) return <Shell><div className="text-slate-400">{isArabic ? "جارٍ تحميل لوحة التحكم…" : "Loading dashboard…"}</div></Shell>;

  const cards = [
    { label: isArabic ? "إجمالي الجلسات" : "Total sessions", value: stats.totalSessions },
    { label: isArabic ? "نشطة" : "Active", value: stats.activeSessions },
    { label: isArabic ? "مكتملة" : "Completed", value: stats.completedSessions },
    { label: isArabic ? "نسبة الإكمال" : "Completion", value: `${stats.completionPercentage}%` },
    { label: isArabic ? "متوسط النتيجة" : "Average score", value: `${stats.averagePercentage}%` },
  ];

  return <Shell>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-300"><Activity size={16}/>{isArabic ? "نظرة مباشرة على الفعالية" : "Live event overview"}</div><h1 className="mt-2 text-3xl font-black text-white">{isArabic ? "لوحة تحكم المسؤول" : "Admin dashboard"}</h1><p className="mt-2 text-sm text-slate-500">{isArabic ? "تتحدث كل 5 ثوانٍ · أسماء المشاركين وإجاباتهم ونتائجهم" : "Updates every 5 seconds · participant names, answers, and scores"}</p></div><div className="flex gap-2"><button onClick={() => void load()} aria-label={isArabic ? "تحديث" : "Refresh"} className="focus-ring grid size-11 place-items-center rounded-lg border border-slate-700 text-slate-400 hover:text-white"><RefreshCw size={18}/></button><button onClick={logout} className="focus-ring flex min-h-11 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:text-white"><LogOut size={17}/>{isArabic ? "خروج" : "Logout"}</button></div></div>
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{cards.map((card) => <div key={card.label} className="panel rounded-xl p-5"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</div><div className="mt-3 text-3xl font-black text-white">{card.value}</div></div>)}</div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
      <section className="panel rounded-2xl p-5 sm:p-7"><div className="mb-6 flex items-center gap-2 font-bold text-white"><BarChart3 className="text-cyan-300" size={20}/>Scenario performance</div><div className="space-y-6">{stats.scenarios.map((scenario) => <div key={scenario.id}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="truncate font-semibold text-slate-300">{scenario.title}</span><span className="shrink-0 text-slate-500">{scenario.accuracy}% · {scenario.attempts} attempts</span></div><div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${scenario.accuracy}%` }}/></div></div>)}</div></section>
      <section className="panel rounded-2xl p-5 sm:p-7"><h2 className="font-bold text-white">Common incorrect decisions</h2><div className="mt-5 space-y-3">{stats.commonIncorrectActions.length ? stats.commonIncorrectActions.map((answer) => <div key={`${answer.scenarioId}-${answer.selectedAction}`} className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 text-sm"><span className="truncate text-slate-400">{answer.selectedAction.replaceAll("-", " ")}</span><span className="rounded bg-rose-400/10 px-2 py-1 text-xs font-bold text-rose-300">{answer.count}</span></div>) : <p className="text-sm leading-6 text-slate-500">No incorrect decisions recorded yet.</p>}</div></section>
    </div>

    <section className="panel mt-6 rounded-2xl p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 font-bold text-white"><ListChecks className="text-cyan-300" size={20}/>{isArabic ? "إجابات المشاركين ونتائجهم" : "Participant answers and scores"}</div><p className="mt-2 text-sm text-slate-500">{sessions.length} {isArabic ? "مشاركاً" : "participants"}</p></div></div>
      <div className="mt-5 space-y-3">{sessions.length ? sessions.map((session) => {
        const isOpen = expanded === session.sessionCode;
        return <article key={session.sessionCode} className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/50">
          <button onClick={() => setExpanded(isOpen ? undefined : session.sessionCode)} className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-left">
            <span className="min-w-44"><strong className="block text-sm text-cyan-200">{session.displayName ?? "Legacy participant"}</strong><span className="mt-0.5 block text-xs text-sky-300">{session.telegramUsername ?? (isArabic ? "لا يوجد اسم Telegram" : "No Telegram username")}</span></span>
            <span className="text-xs text-slate-500">{new Date(session.startedAt).toLocaleString()}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${session.completed ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{session.completed ? "Completed" : `${session.attempts.length}/${session.totalScenarios} answered`}</span>
            <span className="ml-auto text-lg font-black text-white">{session.totalScore}<span className="text-xs text-slate-500">/{session.maximumScore}</span></span>
            {isOpen ? <ChevronUp size={18} className="text-slate-500"/> : <ChevronDown size={18} className="text-slate-500"/>}
          </button>
          {isOpen && session.telegramUsername && <a className="mx-4 mb-3 inline-block text-sm font-semibold text-cyan-300 underline" href={`https://t.me/${session.telegramUsername.slice(1)}`} target="_blank" rel="noreferrer">{isArabic ? "تواصل عبر Telegram" : "Contact on Telegram"}: {session.telegramUsername}</a>}
          {isOpen && <div className="border-t border-slate-700/70 p-4"><div className="grid gap-3 md:grid-cols-2">{session.attempts.length ? session.attempts.map((attempt) => <div key={attempt.scenarioId} className="rounded-lg border border-slate-700 bg-slate-950/70 p-3"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">{attempt.score === 20 ? <CheckCircle2 size={15} className="text-emerald-300"/> : <XCircle size={15} className={attempt.score === 10 ? "text-amber-300" : "text-rose-300"}/>} {scenarioNames[attempt.scenarioId] ?? attempt.scenarioId}<span className="ms-auto text-slate-400">+{attempt.score}</span></div><p className="mt-2 text-sm font-semibold text-white">{attempt.selectedAction.replaceAll("-", " ")}</p><p className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm leading-5 text-slate-400"><span className="font-semibold text-slate-300">{isArabic ? "التبرير:" : "Justification:"}</span> {attempt.reason || (isArabic ? "لا يوجد تبرير مسجل" : "No justification recorded")}</p></div>) : <p className="text-sm text-slate-500">{isArabic ? "لم تُرسل إجابات بعد." : "No answers submitted yet."}</p>}</div></div>}
        </article>;
      }) : <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">No participant sessions yet.</p>}</div>
    </section>
    {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
  </Shell>;
}
