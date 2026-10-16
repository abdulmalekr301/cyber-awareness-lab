import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import type { AttemptResponse } from "../types";

type Choice = { id: string; label: string };

type DecisionPanelProps = {
  className?: string;
  isArabic: boolean;
  eyebrow: string;
  question: string;
  choices: Choice[];
  choice: string;
  onChoice: (id: string) => void;
  reason: string;
  onReason: (reason: string) => void;
  requiresReason?: boolean;
  hideChoices?: boolean;
  minimumReasonLetters?: number;
  reasonLabel: string;
  reasonPlaceholder: string;
  disabled: boolean;
  onSubmit: () => void;
  submitLabel: string;
  checkingLabel: string;
  feedback?: AttemptResponse;
  feedbackText: string;
  onNext: () => void;
  nextLabel: string;
  error: string;
};

export function DecisionPanel({
  className = "",
  isArabic,
  eyebrow,
  question,
  choices,
  choice,
  onChoice,
  reason,
  onReason,
  requiresReason = true,
  hideChoices = false,
  minimumReasonLetters = 0,
  reasonLabel,
  reasonPlaceholder,
  disabled,
  onSubmit,
  submitLabel,
  checkingLabel,
  feedback,
  feedbackText,
  onNext,
  nextLabel,
  error,
}: DecisionPanelProps) {
  const resultLabel = feedback?.scoreAwarded === 20
    ? (isArabic ? "إجابة كاملة" : "Complete answer")
    : feedback?.scoreAwarded === 10
      ? (isArabic ? "نصف النقاط" : "Half credit")
      : (isArabic ? "الإجابة غير صحيحة" : "Incorrect answer");

  return <section className={`border border-[#263e52] border-t-[5px] border-t-[#23b7cc] bg-[#092238] text-white shadow-[0_8px_18px_rgba(9,39,65,.14)] ${className}`} dir={isArabic ? "rtl" : "ltr"}>
    <div className="p-5 sm:p-6">
      {!feedback ? <>
        <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.13em] text-[#7ed6df]"><span className="h-px w-8 bg-[#23b7cc]" />{eyebrow}</div>
        <h2 className="mt-3 max-w-3xl text-lg font-extrabold leading-7 text-white sm:text-xl">{question}</h2>
        {!hideChoices && <div className="mt-5 divide-y divide-[#314b60] border border-[#314b60]">
          {choices.map((item) => {
            const selected = choice === item.id;
            return <button key={item.id} type="button" aria-pressed={selected} onClick={() => onChoice(item.id)} disabled={disabled} className={`flex min-h-14 w-full items-center gap-3 px-4 text-start text-sm font-bold transition sm:text-base ${selected ? "bg-[#153b4d] text-white" : "bg-[#0d2940] text-[#d8e3e9] hover:bg-[#12354a]"}`}>
              <span className={`grid size-5 shrink-0 place-items-center border ${selected ? "border-[#6ed7e1]" : "border-[#7890a1]"}`}><span className={`size-2 ${selected ? "bg-[#6ed7e1]" : "bg-transparent"}`} /></span>
              <span>{item.label}</span>
            </button>;
          })}
        </div>}
        {requiresReason && <>
          <label className="mt-5 block text-sm font-bold text-[#dbe5ea]" htmlFor={`decision-reason-${eyebrow.replace(/\s+/g, "-")}`}>{reasonLabel}</label>
          <textarea id={`decision-reason-${eyebrow.replace(/\s+/g, "-")}`} aria-label={reasonLabel} value={reason} onChange={(event) => onReason(event.target.value.slice(0, 240))} maxLength={240} rows={3} placeholder={reasonPlaceholder} className="mt-2 w-full resize-none border border-[#486176] bg-[#071a2c] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#71869a] focus:border-[#67d5e2]" />
          <div className="mt-1 text-end text-[11px] text-[#8296a5]">{reason.length}/240</div>
        </>}
        <div className={`${requiresReason ? "mt-3" : "mt-5"} flex justify-end`}><button type="button" onClick={onSubmit} disabled={disabled || !choice || (requiresReason && (reason.trim().length < 3 || (reason.match(/\p{L}/gu)?.length ?? 0) < minimumReasonLetters))} className="min-h-11 min-w-44 border border-[#23b7cc] bg-[#23b7cc] px-6 font-extrabold text-[#071426] transition hover:bg-[#67d5e2] disabled:cursor-not-allowed disabled:border-[#304a5e] disabled:bg-[#304a5e] disabled:text-[#8296a5]">{disabled ? checkingLabel : submitLabel}</button></div>
      </> : <div>
        <div className="flex items-center gap-3 font-extrabold text-white">
          {feedback.scoreAwarded === 20 ? <CheckCircle2 className="text-emerald-300" /> : <XCircle className={feedback.scoreAwarded === 10 ? "text-amber-300" : "text-rose-300"} />}
          <span>{resultLabel}</span>
          <span className="ms-auto border-s border-[#486176] ps-3 text-sm text-[#dbe7ee]">+{feedback.scoreAwarded}</span>
        </div>
        <p className="mt-4 border-s-2 border-[#23b7cc] ps-4 text-sm leading-7 text-[#c7d7e1]">{feedbackText}</p>
        <div className="mt-5 flex justify-end"><button type="button" onClick={onNext} className="flex min-h-11 min-w-44 items-center justify-center gap-2 bg-[#23b7cc] px-6 font-extrabold text-[#071426] transition hover:bg-[#67d5e2]">{nextLabel}<ArrowRight size={17} className={isArabic ? "rotate-180" : ""} /></button></div>
      </div>}
      {error && <p role="alert" className="mt-4 border-s-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
    </div>
  </section>;
}
