import { useState } from "react";
import { MessageSquare, MoreHorizontal, Phone, Search, ShieldAlert, Users, Video } from "lucide-react";
import type { AttemptResponse } from "../types";
import { LanguageToggle, localizeFeedback, useLanguage } from "../i18n";
import { DecisionPanel } from "../components/DecisionPanel";

type Props = {
  onAction: (id: string, reason: string) => void;
  disabled: boolean;
  feedback?: AttemptResponse;
  onNext: () => void;
  error: string;
};

export function SocialEngineeringScenario({ onAction, disabled, feedback, onNext, error }: Props) {
  const { language, isArabic } = useLanguage();
  const [choice, setChoice] = useState("");
  const [reason, setReason] = useState("");
  const choices = isArabic ? [
    ["share-code", "نرسل الرمز قبل ما يتقفل الحساب"],
    ["verify-request", "ما نرسلش الرمز، ونتواصل مع الدعم من القناة الرسمية"],
    ["post-code", "ننشر الرمز في مجموعة الفعالية ونسألهم"],
  ] : [
    ["share-code", "Send the code before the account is locked"],
    ["verify-request", "Do not share it; contact support through the official event channel"],
    ["post-code", "Post the code in the event group and ask them"],
  ];

  return <main className="min-h-screen bg-[#f3f2f1] text-slate-900" dir={isArabic ? "rtl" : "ltr"}><LanguageToggle floating />
    <div className="border-b border-amber-300 bg-amber-300 px-4 py-3 text-center text-sm font-bold text-slate-950"><span className="inline-flex items-center gap-2"><ShieldAlert size={18}/>{isArabic ? "هذه محاكاة تدريبية، والرسائل والرموز الظاهرة فيها غير حقيقية." : "Training simulation — the messages and codes shown here are not real."}</span></div>
    <div className="mx-auto max-w-6xl p-3 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl">
        <header className="flex min-h-16 items-center gap-4 bg-[#292929] px-4 text-white">
          <div className="grid size-10 place-items-center rounded-lg bg-[#6264a7]"><Users size={22}/></div>
          <strong>Teams</strong>
          <div className="mx-auto hidden max-w-xl flex-1 items-center gap-2 rounded-md bg-[#3b3a39] px-3 py-2 text-sm text-slate-300 sm:flex"><Search size={16}/>{isArabic ? "بحث" : "Search"}</div>
          <MoreHorizontal className="text-slate-300"/>
        </header>
        <div className="grid min-h-[520px] md:grid-cols-[220px_1fr]">
          <aside className="hidden border-e border-slate-200 bg-[#f7f7f7] p-3 md:block">
            <div className="rounded-md bg-[#e8e8f4] px-3 py-2 text-sm font-semibold text-[#464775]"><span className="inline-flex items-center gap-2"><MessageSquare size={17}/>{isArabic ? "الدردشة" : "Chat"}</span></div>
            <p className="mt-5 px-2 text-xs font-bold uppercase tracking-wider text-slate-500">{isArabic ? "الأحدث" : "Recent"}</p>
            <div className="mt-2 flex items-center gap-3 rounded-md bg-white px-2 py-3 shadow-sm"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-500 font-bold text-white">AS</span><span className="min-w-0"><strong className="block truncate text-sm">{isArabic ? "أحمد | دعم الفعالية" : "Ahmed | Event Support"}</strong><span className="block truncate text-xs text-slate-500">{isArabic ? "ابعث الرمز هنا…" : "Send the code here…"}</span></span></div>
          </aside>
          <section className="flex min-w-0 flex-col bg-white">
            <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-500 font-bold text-white">AS</span>
              <div className="min-w-0"><h1 className="truncate font-semibold">{isArabic ? "أحمد | دعم الفعالية" : "Ahmed | Event Support"}</h1><p className="text-xs text-slate-500">{isArabic ? "مستخدم خارجي" : "External user"}</p></div>
              <div className="ms-auto flex gap-2 text-[#6264a7]"><button aria-label="Video call" className="grid size-9 place-items-center rounded hover:bg-slate-100"><Video size={19}/></button><button aria-label="Phone call" className="grid size-9 place-items-center rounded hover:bg-slate-100"><Phone size={18}/></button></div>
            </header>
            <div className="flex-1 bg-[#faf9f8] px-4 py-7 sm:px-8">
              <div className="mx-auto max-w-2xl">
                <p className="text-center text-xs text-slate-400">{isArabic ? "اليوم، 11:18 ص" : "Today, 11:18 AM"}</p>
                <div className="mt-6 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white">AS</span><div><div className="mb-1 text-xs text-slate-500">{isArabic ? "أحمد | دعم الفعالية" : "Ahmed | Event Support"} · 11:18</div><div className="max-w-xl rounded-lg rounded-ss-none border border-slate-200 bg-white px-4 py-3 text-[15px] leading-7 shadow-sm">{isArabic ? "السلام عليكم، معاك أحمد من دعم الفعالية. عندنا مشكلة في حساب بطاقتك، ولو ما تصلحتش خلال دقايق ممكن ما تقدرش تدخل الورشة." : "Hi, this is Ahmed from event support. There is a problem with your badge account. If we do not fix it in the next few minutes, you may not be able to enter the workshop."}</div></div></div>
                <div className="mt-4 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white">AS</span><div><div className="mb-1 text-xs text-slate-500">{isArabic ? "أحمد | دعم الفعالية" : "Ahmed | Event Support"} · 11:19</div><div className="max-w-xl rounded-lg rounded-ss-none border border-slate-200 bg-white px-4 py-3 text-[15px] leading-7 shadow-sm">{isArabic ? "توا بيوصلك رمز Microsoft من 6 أرقام على هاتفك. ابعثه لي هنا بسرعة حتى نثبت إن الحساب حسابك ونرجع نفعّل البطاقة." : "You will receive a six-digit Microsoft code on your phone now. Send it to me here quickly so I can confirm the account is yours and reactivate the badge."}</div></div></div>
                <div className="mt-5 ms-12 max-w-sm rounded-lg border border-slate-300 bg-white p-3 shadow-sm"><div className="text-xs font-semibold text-slate-500">Microsoft account</div><p className="mt-1 text-sm">{isArabic ? "رمز تسجيل الدخول الخاص بك هو:" : "Your sign-in code is:"} <strong className="font-mono text-lg tracking-[.18em]">482 917</strong></p><p className="mt-1 text-xs text-slate-500">{isArabic ? "لا تعطِ هذا الرمز لأي شخص." : "Do not share this code with anyone."}</p></div>
                <div className="mt-4 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white">AS</span><div><div className="mb-1 text-xs text-slate-500">{isArabic ? "أحمد | دعم الفعالية" : "Ahmed | Event Support"} · 11:20</div><div className="max-w-xl rounded-lg rounded-ss-none border border-slate-200 bg-white px-4 py-3 text-[15px] leading-7 shadow-sm">{isArabic ? "وصل؟ ابعثه توا، باقي أقل من دقيقتين." : "Did it arrive? Send it now — there are less than two minutes left."}</div></div></div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <DecisionPanel
        className="mx-auto mt-5 max-w-4xl"
        isArabic={isArabic}
        eyebrow={isArabic ? "قرارك الأمني" : "Your security decision"}
        question={isArabic ? "كيف ترد على هذه الرسالة؟" : "How would you respond to this message?"}
        choices={choices.map(([id, label]) => ({ id, label }))}
        choice={choice}
        onChoice={setChoice}
        reason={reason}
        onReason={setReason}
        requiresReason={false}
        reasonLabel={isArabic ? "شنو في المحادثة دعم قرارك؟" : "What in the conversation supports your decision?"}
        reasonPlaceholder={isArabic ? "اكتب العلامة اللي لاحظتها في الطلب أو طريقة الكلام…" : "Describe the clue you noticed in the request or wording…"}
        disabled={disabled}
        onSubmit={() => choice && onAction(choice, "")}
        submitLabel={isArabic ? "إرسال القرار" : "Submit decision"}
        checkingLabel={isArabic ? "لحظة، نراجع إجابتك…" : "Checking your answer…"}
        feedback={feedback}
        feedbackText={feedback ? localizeFeedback("social-engineering", feedback.correct, language, feedback.feedback, feedback.scoreAwarded) : ""}
        onNext={onNext}
        nextLabel={isArabic ? "كمّل للسيناريو التالي" : "Next scenario"}
        error={error}
      />
    </div>
  </main>;
}
