import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { api } from "../api";
import { Shell } from "../components/Shell";
import { useLanguage } from "../i18n";

type Result = { sessionCode: string; totalScore: number; maximumScore: number; answers: { scenarioId: string; correct: boolean; score: number }[] };

export function Results() {
  const navigate = useNavigate();
  const { isArabic } = useLanguage();
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState("");
  const code = localStorage.getItem("cyberlab_session");
  useEffect(() => {
    if (!code) { navigate("/join", { replace: true }); return; }
    api<Result>(`/api/sessions/${code}/results`).then(setResult).catch(error => setError(error.message));
  }, []);
  function restart() { localStorage.removeItem("cyberlab_session"); navigate("/"); }
  if (!result) return <Shell compact><div className="panel rounded-2xl p-8 text-center text-slate-400">{error || (isArabic ? "جارٍ إعداد نتائجك…" : "Preparing your results…")}</div></Shell>;
  const message = result.totalScore / result.maximumScore >= 0.75 ? (isArabic ? "لديك حس أمني قوي" : "Strong security instincts") : (isArabic ? "الوعي يتحسن بالممارسة" : "Awareness grows with practice");
  return <Shell compact><div className="panel overflow-hidden rounded-2xl">
    <div className="border-b border-slate-700/60 bg-cyan-300/[.05] p-7 text-center sm:p-10"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><ShieldCheck size={30}/></div><div className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-cyan-300">{isArabic ? "اكتملت المحاكاة" : "Simulation complete"}</div><h1 className="mt-3 text-3xl font-black text-white">{message}</h1><div className="mt-6 text-7xl font-black tracking-[-.06em] text-white">{result.totalScore}<span className="text-2xl text-slate-500">/{result.maximumScore}</span></div></div>
    <div className="p-6 sm:p-8"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{result.answers.map((answer, index) => <div key={answer.scenarioId} className={`rounded-lg border p-3 text-center ${answer.score === 20 ? "border-emerald-400/20 bg-emerald-400/[.05]" : answer.score === 10 ? "border-amber-300/20 bg-amber-300/[.05]" : "border-rose-400/20 bg-rose-400/[.05]"}`}><div className="text-xs text-slate-500">{index + 1}</div><div className={`mt-1 text-sm font-bold ${answer.score === 20 ? "text-emerald-300" : answer.score === 10 ? "text-amber-300" : "text-rose-300"}`}>{answer.score === 20 ? (isArabic ? "صحيح" : "Correct") : answer.score === 10 ? (isArabic ? "نصف" : "Half") : (isArabic ? "راجع" : "Review")}</div></div>)}</div>
      <p className="mt-6 text-center text-sm leading-6 text-slate-400">{isArabic ? "توقف عندما تصنع الرسالة إحساساً بالعجلة. تحقق من الطلبات والعناوين عبر قنوات موثوقة قبل أن تتصرف." : "Pause when a message creates urgency. Verify requests and addresses through trusted channels before you act."}</p>
      <button onClick={restart} className="focus-ring mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-600 font-bold text-white hover:bg-slate-800"><RotateCcw size={18}/>{isArabic ? "ابدأ جلسة أخرى" : "Start another session"}</button>
      <button onClick={() => navigate("/")} className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-slate-300">{isArabic ? "العودة للرئيسية" : "Return home"}<ArrowRight size={15} className={isArabic ? "rotate-180" : ""}/></button>
    </div>
  </div></Shell>;
}
