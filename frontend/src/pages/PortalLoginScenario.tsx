import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Eye, EyeOff, Home, LockKeyhole, MoreVertical, RefreshCw, ShieldAlert, UserRound } from "lucide-react";
import type { AttemptResponse } from "../types";
import { LanguageToggle, localizeFeedback, useLanguage } from "../i18n";
import { DecisionPanel } from "../components/DecisionPanel";

type CaptchaState = "idle" | "checking" | "checked";
type Verdict = "clean" | "hack" | "";

export function PortalLoginScenario({
  onAction,
  disabled,
  feedback,
  onNext,
  error,
}: {
  onAction: (id: string, reason: string) => void;
  disabled: boolean;
  feedback?: AttemptResponse;
  onNext: () => void;
  error: string;
}) {
  const { language, isArabic } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaState>("idle");
  const [verdict, setVerdict] = useState<Verdict>("");
  const [reason, setReason] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function checkCaptcha() {
    if (captcha !== "idle") return;
    setCaptcha("checking");
    timer.current = setTimeout(() => setCaptcha("checked"), 900);
  }

  function submitDecision() {
    if (!verdict || reason.trim().length < 3) return;
    onAction(verdict, reason.trim());
  }

  return <main className="min-h-screen bg-[#686868] font-sans" dir="rtl"><LanguageToggle floating />
    <div className="border-b border-white/10 bg-[#101827] px-3 py-2.5 text-white shadow-lg" dir="ltr" aria-label={isArabic ? "شريط عنوان متصفح المحاكاة" : "Simulation browser address bar"}>
      <div className="mx-auto flex max-w-3xl items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full text-slate-300"><ChevronLeft size={23}/></span>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
          <LockKeyhole size={14} className="shrink-0 text-slate-300"/>
          <span className="min-w-0 break-all font-mono text-[12px] font-semibold leading-4 text-white sm:text-sm">https://sms.u0t.edu.ly/eng/</span>
        </div>
        <MoreVertical size={21} className="shrink-0 text-slate-300"/>
      </div>
    </div>
    <div className="sticky top-0 z-20 border-b border-amber-300/40 bg-amber-300 px-4 py-3 text-center text-sm font-bold leading-6 text-slate-950 shadow-lg">
      <span className="inline-flex items-center gap-2"><ShieldAlert size={19}/>تدريب توعوي افتراضي فقط — هذه ليست بوابة الجامعة الحقيقية. لا تستخدم اسم مستخدم أو كلمة مرور حقيقية.</span>
    </div>

    <section className="min-h-[calc(100vh-52px)] bg-[linear-gradient(to_bottom,#030303_0,#030303_230px,#686868_230px,#686868_100%)] px-4 py-7 sm:py-10">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-md bg-white text-slate-700 shadow-2xl">
        <header className="flex items-center justify-center gap-2 bg-[#82b9df] px-5 py-5 text-center text-lg font-bold text-white sm:text-xl"><UserRound size={24}/>مرحباً بك في لوحة الدخول الخاصة بنظام التسجيل والدراسة</header>

        <div className="space-y-4 p-5 sm:p-7">
          <label className="flex min-h-14 overflow-hidden border border-slate-300 bg-white">
            <span className="grid w-14 shrink-0 place-items-center border-l border-slate-300 bg-slate-100 text-slate-600"><UserRound size={21}/></span>
            <input aria-label="Fictional username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" placeholder="اسم المستخدم" className="min-w-0 flex-1 bg-white px-4 text-right text-slate-800 outline-none placeholder:text-slate-400"/>
          </label>

          <label className="flex min-h-14 overflow-hidden border border-slate-300 bg-white">
            <span className="grid w-14 shrink-0 place-items-center border-l border-slate-300 bg-slate-100 text-slate-600"><LockKeyhole size={21}/></span>
            <input aria-label="Dummy password" value={password} onChange={(event) => setPassword(event.target.value)} type={visible ? "text" : "password"} autoComplete="new-password" placeholder="كلمة المرور" className="min-w-0 flex-1 bg-white px-4 text-right text-slate-800 outline-none placeholder:text-slate-400"/>
            <button type="button" aria-label="Toggle password visibility" onClick={() => setVisible(!visible)} className="grid w-12 place-items-center bg-white text-slate-400 hover:text-slate-700">{visible ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
          </label>

          <div className="flex min-h-10 items-center border border-slate-300 bg-white">
            <span className="grid w-14 self-stretch place-items-center border-l border-slate-300 bg-slate-100 text-slate-600"><Home size={20}/></span>
            <span className="flex-1 px-4 text-sm">الدراسة الجامعية</span>
            <span className="px-4 text-slate-400">⌄</span>
          </div>

          <div className="flex flex-col-reverse items-stretch justify-between gap-5 pt-1 sm:flex-row sm:items-center">
            <div className="text-center sm:min-w-36">
              <button type="button" aria-label="Simulated portal login" disabled={captcha !== "checked"} className="min-h-11 rounded border border-[#4693c7] bg-[#82b9df] px-6 font-bold text-white transition hover:bg-[#69aad6] disabled:cursor-not-allowed disabled:opacity-45">الدخول</button>
              <p className="mt-2 text-sm text-[#247fb8]">هل نسيت كلمة المرور؟</p>
            </div>

            <button type="button" aria-label="I am not a robot training checkbox" onClick={checkCaptcha} disabled={captcha !== "idle"} className="flex min-h-[92px] flex-1 items-center gap-4 border border-slate-300 bg-[#fafafa] px-5 text-right shadow-sm disabled:cursor-default">
              <span className={`grid size-8 shrink-0 place-items-center border-2 bg-white ${captcha === "checked" ? "border-emerald-500" : "border-slate-500"}`}>
                {captcha === "checking" && <span className="size-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"/>}
                {captcha === "checked" && <Check size={24} strokeWidth={3} className="text-emerald-600"/>}
              </span>
              <strong className="font-semibold text-slate-800">أنا لست برنامج روبوت</strong>
              <span className="ms-auto flex shrink-0 flex-col items-center text-center text-[9px] leading-3 text-slate-500" aria-label="Simulated reCAPTCHA logo">
                <span className="grid size-10 place-items-center rounded bg-white"><RefreshCw size={30} strokeWidth={3} className="text-blue-600"/></span>
                <span className="mt-0.5 text-[10px] font-semibold text-slate-600">reCAPTCHA</span>
                <span>Privacy · Terms</span>
              </span>
            </button>
          </div>

        </div>
      </div>

      <DecisionPanel
        className="mx-auto mt-6 max-w-3xl"
        isArabic={isArabic}
        eyebrow={isArabic ? "قرارك الأمني" : "Your security decision"}
        question={isArabic ? "كيف تصنّف صفحة تسجيل الدخول هذه؟" : "How would you classify this sign-in page?"}
        choices={isArabic ? [{ id: "clean", label: "سليم" }, { id: "hack", label: "اختراق" }] : [{ id: "clean", label: "Clean" }, { id: "hack", label: "Hack" }]}
        choice={verdict}
        onChoice={(id) => setVerdict(id as Verdict)}
        reason={reason}
        onReason={setReason}
        reasonLabel={isArabic ? "شنو الدليل اللي اعتمدت عليه؟" : "What evidence supports your classification?"}
        reasonPlaceholder={isArabic ? "اكتب العلامة اللي لاحظتها في الصفحة أو العنوان…" : "Describe the clue you noticed in the page or address…"}
        disabled={disabled}
        onSubmit={submitDecision}
        submitLabel={isArabic ? "إرسال القرار" : "Submit decision"}
        checkingLabel={isArabic ? "جارٍ فحص الإجابة…" : "Checking your answer…"}
        feedback={feedback}
        feedbackText={feedback ? localizeFeedback("login-safety", feedback.correct, language, feedback.feedback, feedback.scoreAwarded) : ""}
        onNext={onNext}
        nextLabel={isArabic ? "السيناريو التالي" : "Next scenario"}
        error={error}
      />
    </section>
  </main>;
}
