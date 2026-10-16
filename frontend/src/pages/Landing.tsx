import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, FileWarning, KeyRound, Mail, Send, ShieldQuestion, Smartphone, UserRound, Calculator, FolderLock, Wifi } from "lucide-react";
import { api } from "../api";
import { Shell } from "../components/Shell";
import { useLanguage } from "../i18n";

const heroIllustration = new URL("../assets/cybersecurity-hero-v2.png", import.meta.url).href;

type SessionSummary = { sessionCode: string; completed: boolean };

export function Landing() {
  const navigate = useNavigate();
  const { isArabic } = useLanguage();
  const [creating, setCreating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [error, setError] = useState("");

  async function start(event: FormEvent) {
    event.preventDefault();
    const name = displayName.trim().replace(/\s+/g, " ");
    if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'’\-]{1,79}$/u.test(name)) {
      setError("Enter a valid name using 2 to 80 letters.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const session = await api<SessionSummary>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ displayName: name, telegramUsername: telegramUsername.trim() }),
      });
      localStorage.setItem("cyberlab_session", session.sessionCode);
      navigate("/simulation");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to start the experience";
      setError(message);
      setCreating(false);
    }
  }

  const scenarios = [
    { icon: Mail, ar: "رسالة بريد مشبوهة", en: "Suspicious email" },
    { icon: FileWarning, ar: "ملف غير متوقع", en: "Unexpected attachment" },
    { icon: KeyRound, ar: "طلب رمز دخول", en: "Verification code request" },
    { icon: Smartphone, ar: "موافقة ما طلبتهاش", en: "Unknown sign-in approval" },
    { icon: Calculator, ar: "محقق الصلاحيات", en: "Permission Detective" },
    { icon: FolderLock, ar: "أنقذ الملفات", en: "Ransomware: Save the Files" },
    { icon: Wifi, ar: "فخ الواي فاي: اختر شبكتك", en: "Wi-Fi Trap: Choose Your Network" },
  ];

  return <Shell><div className="landing-page">
    <section className="landing-hero">
      <img src={heroIllustration} alt={isArabic ? "رسم توعوي يوضح اكتشاف رسالة تصيد ومسار تحقق آمن" : "Cybersecurity artwork showing a phishing message being detected and verified"}/>
      <div className="landing-hero__shade" />
      <div className="landing-hero__copy">
        <span>{isArabic ? "مختبر الوعي السيبراني" : "Cyber awareness lab"}</span>
        <h1>{isArabic ? <>اختبر قرارك قبل<br/>أن يصبح موقفاً حقيقياً</> : <>Test your decision before<br/>it becomes a real situation</>}</h1>
        <p>{isArabic ? "سبعة مواقف قصيرة من حياتنا الرقمية اليومية. شوف التفاصيل، خذ قرارك، واشرح علاش." : "Seven short situations from everyday digital life. Notice the details, make your call, and explain why."}</p>
      </div>
      <div className="landing-hero__note">{isArabic ? "الأمان يبدأ من قرار واعٍ" : "Safer habits start with one informed decision"}</div>
    </section>

    <section className="landing-workspace">
      <aside className="scenario-index" id="scenarios">
        <div className="section-kicker"><ShieldQuestion size={18}/>{isArabic ? "ماذا ستواجه؟" : "What you will face"}</div>
        <h2>{isArabic ? "مواقف عادية، لكن القرار يفرق." : "Ordinary moments. Decisions that matter."}</h2>
        <div className="scenario-rows">{scenarios.map((scenario, index) => {
          const Icon = scenario.icon;
          return <div className="scenario-row" key={scenario.en}><span className="scenario-number">0{index + 1}</span><span className="scenario-icon"><Icon size={19}/></span><strong>{isArabic ? scenario.ar : scenario.en}</strong><ArrowUpRight size={17}/></div>;
        })}</div>
        <p className="scenario-footnote">{isArabic ? "التمرين يستغرق نحو عشر دقائق، ومتاح للطلاب والموظفين وكل أفراد المجتمع." : "The exercise takes about ten minutes and is open to students, staff, and the wider community."}</p>
      </aside>

      <section className="join-card" aria-labelledby="join-title">
        <div className="join-card__heading"><span>{isArabic ? "ابدأ من هنا" : "Start here"}</span><h2 id="join-title">{isArabic ? "سجّل بياناتك وابدأ الاختبار" : "Enter your details to begin the assessment"}</h2></div>
        <form onSubmit={start} className="join-form">
          <label><span><UserRound size={17}/>{isArabic ? "الاسم الكامل" : "Full name"}</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" maxLength={80} placeholder={isArabic ? "اكتب اسمك" : "Your name"} required/></label>
          <label><span><Send size={17}/>{isArabic ? "اسم مستخدم Telegram" : "Telegram username"}</span><input type="text" value={telegramUsername} onChange={(event) => setTelegramUsername(event.target.value)} autoComplete="off" pattern="@?[A-Za-z0-9_]{5,32}" title={isArabic ? "من 5 إلى 32 حرفاً إنجليزياً أو رقماً أو شرطة سفلية" : "5 to 32 letters, numbers, or underscores"} maxLength={33} placeholder="@yourusername" dir="ltr" required/></label>
          <button disabled={creating} className="primary-action">{creating ? (isArabic ? "انتظر لحظة…" : "Please wait…") : (isArabic ? "ابدأ التدريب" : "Begin assessment")}<ArrowRight size={19} className={isArabic ? "rotate-180" : ""}/></button>
        </form>
        {error && <p role="alert" className="form-error">{error}</p>}
        <p className="privacy-note">{isArabic ? "يُحفظ تقدمك برمز الجلسة على هذا المتصفح. يُستخدم اسم Telegram للتواصل مع الفائزين فقط. لا تدخل كلمة مرور حقيقية." : "Your progress is saved using a session code in this browser. Your Telegram username is for contacting winners. Never enter a real password."}</p>
      </section>
    </section>
  </div></Shell>;
}
