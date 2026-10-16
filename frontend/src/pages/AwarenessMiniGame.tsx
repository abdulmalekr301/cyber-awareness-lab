import { useEffect, useState } from "react";
import { FolderLock, ShieldCheck, WifiOff } from "lucide-react";
import { Shell } from "../components/Shell";
import { PermissionReview } from "../components/PermissionReview";
import { NetworkMonitor } from "../components/legacy/NetworkMonitor";
import { WifiTrap } from "../components/WifiTrap";
import { LegacyWifiTrap } from "../components/legacy/WifiTrap";
import { DecisionPanel } from "../components/DecisionPanel";
import { localizeFeedback, localizeScenario, useLanguage } from "../i18n";
import type { AttemptResponse, Scenario } from "../types";

type Props = {
  scenario: Scenario; number: number; total: number; score: number;
  onAction: (action: string, reason: string) => void; disabled: boolean;
  feedback?: AttemptResponse; onNext: () => void; error: string;
};

export function AwarenessMiniGame({ scenario: source, number, total, score, onAction, disabled, feedback, onNext, error }: Props) {
  const { language, isArabic } = useLanguage();
  const scenario = localizeScenario(source, language);
  const legacyWifi = source.id === "wifi-trap" && source.actions.some((action) => action.id === "verify-with-staff");
  const WifiGame = legacyWifi ? LegacyWifiTrap : WifiTrap;
  const code = localStorage.getItem("cyberlab_session");
  const draftKey = code ? `cyberlab_draft_${code}_${source.id}` : undefined;
  const [draft, setDraft] = useState(() => {
    try {
      const saved = draftKey ? JSON.parse(sessionStorage.getItem(draftKey) ?? "null") : null;
      return { choice: source.actions.some((action) => action.id === saved?.choice) ? String(saved.choice) : "", reason: typeof saved?.reason === "string" ? saved.reason.slice(0, 240) : "" };
    } catch { return { choice: "", reason: "" }; }
  });
  const { choice, reason } = draft;
  const setChoice = (choice: string) => setDraft((current) => ({ ...current, choice }));
  const setReason = (reason: string) => setDraft((current) => ({ ...current, reason }));
  useEffect(() => {
    if (!draftKey) return;
    try {
      if (feedback) sessionStorage.removeItem(draftKey);
      else sessionStorage.setItem(draftKey, JSON.stringify(draft));
    } catch { /* The controlled fields still work if browser storage is unavailable. */ }
  }, [draftKey, draft, feedback]);
  const progress = feedback?.progress ?? number - 1;
  return <Shell compact>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-[#52677a]">
      <span>{isArabic ? `السيناريو ${number} من ${total}` : `Scenario ${number} of ${total}`}</span>
      <span>{feedback?.totalScore ?? score} / {total * 20}</span>
    </div>
    <div role="progressbar" aria-label={isArabic ? "تقدم التدريب" : "Game progress"} aria-valuemin={0} aria-valuemax={total} aria-valuenow={progress} className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#d5dedd]"><div className="h-full bg-[#087f96] transition-all" style={{ width: `${progress / total * 100}%` }}/></div>
    <section className="panel mb-5 rounded-xl p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-wider text-[#087f96]">{scenario.eyebrow}</p>
      <h1 className="mt-2 text-2xl font-black sm:text-3xl">{scenario.title}</h1>
      <p className="mt-3 text-sm leading-7 text-[#52677a]">{scenario.description}</p>
      {source.id === "permission-detective" && <PermissionReview isArabic={isArabic}/>}
      {source.id === "ransomware" && <div className="mt-5 border border-amber-300 bg-amber-50 p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900"><ShieldCheck size={18}/>{isArabic ? "محاكاة آمنة — لم تتأثر أي ملفات" : "Safe simulation — no files are affected"}</div>
        <div className="mt-5 flex items-start gap-3"><FolderLock className="shrink-0 text-amber-800" size={30}/><div><h2 className="font-bold text-amber-950">{isArabic ? "رسالة خيالية: «تم قفل الملفات»" : "Fictional message: “Files locked”"}</h2><p className="mt-2 text-sm leading-6 text-amber-900">{isArabic ? "الرسالة تطلب الدفع لاستعادة الملفات. توقف واختر استجابة آمنة." : "The message demands payment to restore files. Pause and choose a safe response."}</p></div></div>
        <p className="mt-4 flex items-center gap-2 text-xs text-amber-900"><WifiOff size={16}/>{isArabic ? "أنت تختار إجراءً تدريبياً فقط؛ لن يتغير اتصال جهازك." : "You are choosing a training action; your device connection will not change."}</p>
      </div>}
      {source.id === "wifi-trap" && <WifiGame actions={scenario.actions} choice={choice} onChoice={setChoice} disabled={disabled || Boolean(feedback)} isArabic={isArabic}/>}
      {source.id === "network-defender" && <NetworkMonitor actions={scenario.actions} choice={choice} onChoice={setChoice} disabled={disabled || Boolean(feedback)} isArabic={isArabic}/>}
    </section>
    <DecisionPanel className="awareness-decision" isArabic={isArabic} eyebrow={isArabic ? "قرارك الأمني" : "Your security decision"} question={scenario.prompt}
      choices={scenario.actions} choice={choice} onChoice={setChoice} reason={reason} onReason={setReason}
      hideChoices={source.id === "network-defender" || source.id === "wifi-trap"} minimumReasonLetters={3}
      reasonLabel={source.id === "wifi-trap" ? (isArabic ? "لماذا اخترت هذا الإجراء؟" : "Why did you choose this action?") : (isArabic ? "اشرح سبب اختيارك" : "Explain your reasoning")}
      reasonPlaceholder={isArabic ? "اشرح سبب اختيارك لهذه الإجابة..." : "Explain why you chose this answer..."} disabled={disabled} onSubmit={() => { if (choice && (reason.match(/\p{L}/gu)?.length ?? 0) >= 3 && reason.length <= 240) onAction(choice, reason.trim()); }}
      submitLabel={isArabic ? "إرسال القرار" : "Submit decision"} checkingLabel={isArabic ? "جارٍ فحص الإجابة…" : "Checking your answer…"}
      feedback={feedback} feedbackText={feedback ? localizeFeedback(legacyWifi ? "wifi-trap-legacy" : source.id, feedback.correct, language, feedback.feedback, feedback.scoreAwarded) : ""}
      onNext={onNext} nextLabel={feedback?.completed ? (isArabic ? "عرض النتائج" : "View results") : (isArabic ? "السيناريو التالي" : "Next scenario")} error={error}/>
  </Shell>;
}
