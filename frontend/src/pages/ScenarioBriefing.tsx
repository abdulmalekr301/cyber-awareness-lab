import { ArrowRight, Link2, TimerReset } from "lucide-react";
import { Shell } from "../components/Shell";
import type { Scenario } from "../types";
import { useLanguage } from "../i18n";

export function ScenarioBriefing({ scenario, number, total, onLaunch }: { scenario: Scenario; number: number; total: number; onLaunch: () => void }) {
  const { isArabic } = useLanguage();
  return <Shell compact><section className="mx-auto max-w-2xl pt-8 text-center sm:pt-16">
    <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300"><TimerReset size={30}/></div>
    <div className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">{isArabic ? `السيناريو ${number} من ${total}` : `Scenario ${number} of ${total}`}</div>
    <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{scenario.briefing.title}</h1>
    <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-400">{scenario.briefing.scene}</p>
    <div className="mt-9 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 text-left">
      <span className="flex items-center gap-3 border-b border-slate-700/70 px-5 py-3 text-xs font-semibold uppercase tracking-[.16em] text-slate-500"><Link2 size={15}/>{isArabic ? "الرابط الوارد" : "Incoming link"}</span>
      <button type="button" onClick={onLaunch} className="focus-ring group flex min-h-20 w-full items-center gap-4 px-5 py-5 text-start transition hover:bg-cyan-300/[.08]">
        <span className="min-w-0 flex-1 break-words font-mono text-sm font-bold leading-6 text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 sm:text-base">{scenario.briefing.linkLabel}</span>
        <ArrowRight size={20} className={`shrink-0 text-cyan-300 transition group-hover:translate-x-1 ${isArabic ? "rotate-180" : ""}`}/>
      </button>
    </div>
    <p className="mt-5 text-xs text-slate-600">{isArabic ? "بيئة تدريبية · لا تدخل بيانات دخول حقيقية أو معلومات شخصية" : "Training environment · Do not enter real credentials or personal information"}</p>
  </section></Shell>;
}
