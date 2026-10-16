import { useState } from "react";
import { ChevronLeft, Inbox, Mail, MoreHorizontal, Paperclip, Reply, Search, ShieldAlert, Star, Trash2 } from "lucide-react";
import type { AttemptResponse } from "../types";
import { LanguageToggle, localizeFeedback, useLanguage } from "../i18n";
import { DecisionPanel } from "../components/DecisionPanel";

export function EmailPhishingScenario({ onAction, disabled, feedback, onNext, error }: { onAction: (id: string, reason: string) => void; disabled: boolean; feedback?: AttemptResponse; onNext: () => void; error: string }) {
  const { language, isArabic } = useLanguage();
  const [showDestination, setShowDestination] = useState(false);
  const [choice, setChoice] = useState("");
  const [reason, setReason] = useState("");
  return <main className="min-h-screen bg-slate-100 text-slate-900" dir={isArabic ? "rtl" : "ltr"}><LanguageToggle floating />
    <div className="border-b border-amber-300 bg-amber-300 px-4 py-3 text-center text-sm font-bold text-slate-950"><span className="inline-flex items-center gap-2"><ShieldAlert size={18}/>{isArabic ? "محاكاة تدريبية فقط — لا تدخل بيانات دخول حقيقية أو معلومات شخصية." : "Training simulation only — do not enter real credentials or personal information."}</span></div>
    <div className="mx-auto max-w-6xl p-3 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
        <header className="flex items-center gap-4 border-b border-slate-200 px-4 py-3"><div className="grid size-10 place-items-center rounded-lg bg-blue-600 text-white"><Mail size={21}/></div><strong className="hidden sm:block">{isArabic ? "البريد" : "Mail"}</strong><div className="mx-auto flex max-w-xl flex-1 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500"><Search size={17}/>{isArabic ? "بحث" : "Search"}</div><MoreHorizontal className="text-slate-500"/></header>
        <div className="grid min-h-[480px] md:grid-cols-[190px_1fr]">
          <aside className="hidden border-e border-slate-200 bg-slate-50 p-4 md:block"><button className="flex w-full items-center gap-3 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800"><Inbox size={17}/>{isArabic ? "الوارد" : "Inbox"} <span className="ms-auto">1</span></button><div className="mt-3 space-y-1 text-sm text-slate-600"><p className="flex items-center gap-3 px-3 py-2"><Star size={16}/>{isArabic ? "المميزة" : "Starred"}</p><p className="flex items-center gap-3 px-3 py-2"><Paperclip size={16}/>{isArabic ? "المسودات" : "Drafts"}</p><p className="flex items-center gap-3 px-3 py-2"><Trash2 size={16}/>{isArabic ? "المحذوفة" : "Deleted"}</p></div></aside>
          <article className="p-4 sm:p-7">
            <div className="flex items-start gap-3"><button className="mt-1 text-slate-500"><ChevronLeft size={22}/></button><div className="min-w-0 flex-1"><h1 className="text-xl font-semibold sm:text-2xl">{isArabic ? "تعديل في راتب هذا الشهر — راجعه اليوم" : "Updated payroll statement — review today"}</h1><div className="mt-5 flex items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 font-bold text-white">HR</div><div className="min-w-0 text-sm"><div><strong>{isArabic ? "خدمات الرواتب" : "Payroll Services"}</strong> <span className="text-slate-500">&lt;payroll-updates@documents-mail.com&gt;</span></div><div className="mt-1 text-xs text-slate-500">{isArabic ? "إليك · 10:42 ص" : "to you · 10:42 AM"}</div></div></div>
              <div className="mt-7 max-w-2xl text-[15px] leading-7 text-slate-700"><p>{isArabic ? "السلام عليكم،" : "Hello,"}</p><p className="mt-4">{isArabic ? "صار تعديل في راتب هذا الشهر. افتح ملف Excel المرفق اليوم، ولو ظهر لك شريط أصفر اضغط «تمكين المحتوى» حتى تظهر القيمة الجديدة." : <>A correction was made to this month&apos;s payroll statement. Open the attached spreadsheet today and select <strong>Enable Content</strong> if Microsoft Excel asks you to enable macros.</>}</p><p className="mt-4">{isArabic ? "لازم تفعّل الماكرو حتى تشوف المبلغ بعد التعديل." : "The macros are required to display the corrected amount."}</p>
                <button type="button" onClick={() => setShowDestination(!showDestination)} className="mt-6 inline-flex items-center gap-2 rounded border border-slate-300 bg-slate-50 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"><Paperclip size={17}/>Updated-payroll-statement.xlsm</button>
                {showDestination && <div className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">{isArabic ? "شريط داخل الملف: «تم تعطيل وحدات الماكرو — تمكين المحتوى»" : "Document banner: “Macros have been disabled — Enable Content”"}</div>}
                <p className="mt-6">{isArabic ? <>مع التحية،<br/>خدمات الرواتب</> : <>Regards,<br/>Payroll Services</>}</p>
              </div>
              <div className="mt-7 flex gap-2"><button className="flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm text-slate-600"><Reply size={16}/>Reply</button><button className="rounded border border-slate-300 px-3 text-slate-600"><MoreHorizontal size={17}/></button></div>
            </div></div>
          </article>
        </div>
      </div>

      <DecisionPanel
        className="mx-auto mt-5 max-w-3xl"
        isArabic={isArabic}
        eyebrow={isArabic ? "قرارك الأمني" : "Your security decision"}
        question={isArabic ? "شنو التصرف الأكثر أماناً مع هذا المرفق؟" : "What is the safest response to this attachment?"}
        choices={(isArabic ? [["enable-macros", "فتح الملف وتفعيل الماكرو"], ["report-attachment", "التحقق والإبلاغ"]] : [["enable-macros", "Open and enable macros"], ["report-attachment", "Verify and report"]]).map(([id, label]) => ({ id, label }))}
        choice={choice}
        onChoice={setChoice}
        reason={reason}
        onReason={setReason}
        reasonLabel={isArabic ? "شنو العلامة اللي خلتك تختار؟" : "What clue led to your decision?"}
        reasonPlaceholder={isArabic ? "اكتب شنو لاحظت في المرسل أو المرفق أو الطلب…" : "Describe what you noticed about the sender, attachment, or request…"}
        disabled={disabled}
        onSubmit={() => onAction(choice, reason.trim())}
        submitLabel={isArabic ? "إرسال القرار" : "Submit decision"}
        checkingLabel={isArabic ? "جارٍ فحص الإجابة…" : "Checking your answer…"}
        feedback={feedback}
        feedbackText={feedback ? localizeFeedback("phishing", feedback.correct, language, feedback.feedback, feedback.scoreAwarded) : ""}
        onNext={onNext}
        nextLabel={isArabic ? "السيناريو التالي" : "Next scenario"}
        error={error}
      />
    </div>
  </main>;
}
