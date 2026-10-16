import { useState } from "react";
import { MapPin, ShieldAlert, Smartphone } from "lucide-react";
import type { AttemptResponse } from "../types";
import { LanguageToggle, localizeFeedback, useLanguage } from "../i18n";
import { DecisionPanel } from "../components/DecisionPanel";

export function MicrosoftComparisonScenario({ onAction, disabled, feedback, onNext, error, final = false }: { onAction: (id: string, reason: string) => void; disabled: boolean; feedback?: AttemptResponse; onNext: () => void; error: string; final?: boolean }) {
  const { language, isArabic } = useLanguage();
  const [choice, setChoice] = useState("");
  const [reason, setReason] = useState("");
  return <main className="min-h-screen bg-[#eef2f7] p-4 text-slate-900 sm:p-8" dir={isArabic ? "rtl" : "ltr"}><LanguageToggle floating />
    <div className="mx-auto max-w-4xl">
      <div className="rounded-xl border border-amber-300 bg-amber-200 px-4 py-3 text-center text-sm font-bold"><span className="inline-flex items-center gap-2"><ShieldAlert size={18}/>{isArabic ? "محاكاة تدريبية — هذا ليس طلب موافقة حقيقياً من Microsoft." : "Training simulation — this is not a real Microsoft approval request."}</span></div>
      <div className="mt-6 grid gap-5 md:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-[2rem] bg-slate-900 p-4 shadow-2xl"><div className="rounded-[1.5rem] bg-white p-6"><div className="flex items-center gap-3 text-blue-700"><Smartphone/><strong>Microsoft Authenticator</strong></div><h1 className="mt-8 text-2xl font-bold">{isArabic ? "توافق على تسجيل الدخول؟" : "Approve sign-in?"}</h1><p className="mt-2 text-sm text-slate-600">{isArabic ? "فيه محاولة دخول تنتظر موافقتك." : "A sign-in request needs your approval."}</p><div className="mt-6 space-y-3 rounded-xl bg-slate-100 p-4 text-sm"><p><strong>{isArabic ? "الحساب:" : "Account:"}</strong> your.name@example.com</p><p className="flex items-center gap-2"><MapPin size={16}/><strong>{isArabic ? "المكان:" : "Location:"}</strong> {isArabic ? "وارسو، بولندا" : "Warsaw, Poland"}</p><p><strong>{isArabic ? "الجهاز:" : "Device:"}</strong> Windows / Chrome</p><p><strong>{isArabic ? "الوقت:" : "Time:"}</strong> {isArabic ? "توا" : "Just now"}</p></div><div className="mt-6 grid grid-cols-2 gap-3"><button className="rounded-lg border border-slate-300 py-3 font-bold text-slate-700">{isArabic ? "رفض" : "Deny"}</button><button className="rounded-lg bg-blue-600 py-3 font-bold text-white">{isArabic ? "موافقة" : "Approve"}</button></div></div></section>
        <section className="rounded-2xl bg-white p-6 shadow-lg"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">{isArabic ? "مكالمة واردة" : "Incoming phone call"}</div><h2 className="mt-3 text-xl font-bold">{isArabic ? "«دعم Microsoft»" : "“Microsoft IT Support”"}</h2><blockquote className="mt-5 rounded-xl border-s-4 border-blue-500 bg-blue-50 p-4 leading-7 text-slate-700">{isArabic ? "«نحن نصلّح مشكلة في حسابك. وافق على الإشعار توا، ولو انتهى الوقت ممكن يتقفل بريدك.»" : "“We are repairing your account. Please approve the notification now. If it expires, your email may be locked.”"}</blockquote><p className="mt-5 text-sm leading-6 text-slate-500">{isArabic ? "أنت ما حاولتش تسجّل دخول، ومش موجود في وارسو، وما تواصلتش مع الدعم قبل المكالمة." : "You did not start a sign-in, you are not in Warsaw, and official support was not contacted."}</p></section>
      </div>
      <DecisionPanel
        className="mt-5"
        isArabic={isArabic}
        eyebrow={isArabic ? "قرارك الأمني" : "Your security decision"}
        question={isArabic ? "كيف تتصرف مع طلب الموافقة هذا؟" : "How should you respond to this approval request?"}
        choices={(isArabic ? [["approve-request", "الموافقة كي ينهي الدعم عمله"], ["deny-and-report", "الرفض وتأمين الحساب والإبلاغ"]] : [["approve-request", "Approve so support can finish"], ["deny-and-report", "Deny, secure the account, and report it"]]).map(([id, label]) => ({ id, label }))}
        choice={choice}
        onChoice={setChoice}
        reason={reason}
        onReason={setReason}
        reasonLabel={isArabic ? "ما الذي في الموقف يدعم قرارك؟" : "What in the situation supports your decision?"}
        reasonPlaceholder={isArabic ? "اذكر العلامة الأمنية التي لاحظتها…" : "Identify the security clue you noticed…"}
        disabled={disabled}
        onSubmit={() => onAction(choice, reason.trim())}
        submitLabel={isArabic ? "إرسال القرار" : "Submit decision"}
        checkingLabel={isArabic ? "جارٍ فحص الإجابة…" : "Checking your answer…"}
        feedback={feedback}
        feedbackText={feedback ? localizeFeedback("url-safety", feedback.correct, language, feedback.feedback, feedback.scoreAwarded) : ""}
        onNext={onNext}
        nextLabel={final ? (isArabic ? "عرض النتائج" : "View results") : (isArabic ? "السيناريو التالي" : "Next scenario")}
        error={error}
      />
    </div>
  </main>;
}
