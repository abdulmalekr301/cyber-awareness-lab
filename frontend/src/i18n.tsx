import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Scenario } from "./types";

export type Language = "en" | "ar";
type LanguageContextValue = { language: Language; isArabic: boolean; toggleLanguage: () => void };
const LanguageContext = createContext<LanguageContextValue>({ language: "en", isArabic: false, toggleLanguage: () => undefined });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem("cyberlab_language") === "ar" ? "ar" : "en");
  useEffect(() => {
    localStorage.setItem("cyberlab_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const value = useMemo(() => ({ language, isArabic: language === "ar", toggleLanguage: () => setLanguage(value => value === "en" ? "ar" : "en") }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle({ floating = false }: { floating?: boolean }) {
  const { isArabic, toggleLanguage } = useLanguage();
  return <button type="button" onClick={toggleLanguage} className={`${floating ? "fixed end-4 top-16 z-50 shadow-xl" : ""} language-toggle focus-ring`} aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}><span aria-hidden="true">◎</span>{isArabic ? "English" : "العربية"}</button>;
}

const arabicScenarios: Record<string, Omit<Scenario, "id">> = {
  "wifi-trap": {
    title: "فخ الواي فاي: اختر شبكتك", eyebrow: "السيناريو 7 · الاتصال اللاسلكي",
    description: "وصلت إلى مؤتمر جامعي خيالي للأمن السيبراني وتريد الاتصال بالواي فاي. تظهر عدة شبكات، لكن الموظفين لم يعطوك بعد معلومات الشبكة المؤكدة.",
    prompt: "أي شبكة ستكون أكثر حذراً من الاتصال بها دون التحقق منها؟",
    briefing: { title: "قارن الشبكات المتاحة", scene: "يعرض هاتفك ثلاث شبكات بأسماء تشبه شبكات الجامعة. راجع أسماءها وتفاصيل الاتصال، ثم اختر الشبكة التي ستكون أكثر حذراً منها دون التحقق. كل معلومات الشبكات في هذا التدريب محاكاة.", linkLabel: "إعدادات الواي فاي · الشبكات المتاحة", launchText: "راجع خيارات الواي فاي" },
    actions: [{ id: "caution-campus", label: "الحذر أكثر من شبكة Campus_WiFi" }, { id: "caution-guest-free", label: "الحذر أكثر من شبكة Campus_Guest_Free" }, { id: "caution-campus-5g", label: "الحذر أكثر من شبكة Campus_WiFi_5G" }]
  },
  "wifi-trap-legacy": {
    title: "فخ الواي فاي: اختر شبكتك", eyebrow: "السيناريو 7 · الاتصال اللاسلكي",
    description: "وصلت إلى مؤتمر جامعي خيالي للأمن السيبراني وتريد الاتصال بالواي فاي. تظهر عدة شبكات، لكن الموظفين لم يعطوك بعد معلومات الشبكة المؤكدة.",
    prompt: "ما الإجراء الأكثر أماناً قبل الاتصال؟",
    briefing: { title: "اختر كيف تتصل بالإنترنت", scene: "يعرض هاتفك عدة شبكات بأسماء تشبه شبكات الجامعة. راجع الخيارات وحدد ما ستفعله قبل الاتصال. كل معلومات الشبكات في هذا التدريب محاكاة.", linkLabel: "إعدادات الواي فاي · الشبكات المتاحة", launchText: "راجع خيارات الواي فاي" },
    actions: [{ id: "connect-campus", label: "الاتصال الآن بشبكة Campus_WiFi" }, { id: "connect-free", label: "الاتصال الآن بشبكة Campus_Free_WiFi" }, { id: "connect-official", label: "الاتصال الآن بشبكة Campus_WiFi_Official" }, { id: "verify-with-staff", label: "التأكد من معلومات الشبكة الرسمية مع موظفي المؤتمر قبل الاتصال" }]
  },
  "permission-detective": {
    title: "محقق الصلاحيات", eyebrow: "السيناريو 5 · صلاحيات التطبيقات",
    description: "QuickCalc+ تطبيق آلة حاسبة خيالي يطلب الوصول إلى الميكروفون وجهات الاتصال والموقع قبل استخدامه.",
    prompt: "شنو تدير قبل استخدام الآلة الحاسبة؟",
    briefing: { title: "راجع تطبيق آلة حاسبة جديد", scene: "تحتاج آلة حاسبة بسيطة لورشة. تظهر شاشة صلاحيات قبل التثبيت. افحص الوصول الذي يطلبه التطبيق.", linkLabel: "QuickCalc+ · راجع صلاحيات التطبيق", launchText: "راجع الصلاحيات" },
    actions: [{ id: "allow-all", label: "نوافق على كل شيء؛ ممكن التطبيق يحتاجه" }, { id: "review-permissions", label: "نراجع الصلاحيات ونرفض الوصول غير الضروري" }, { id: "install-unchecked", label: "نثبّت التطبيق بدون مراجعة الصلاحيات" }, { id: "friend-test", label: "نبعثه لصديق حتى يجرّبه أولاً" }],
  },
  ransomware: {
    title: "برمجية الفدية: أنقذ الملفات", eyebrow: "السيناريو 6 · الاستجابة لحادث",
    description: "حاسوب مكتب جامعي خيالي يعرض فجأة رسالة تقول إن الملفات مقفلة وتطلب الدفع.",
    prompt: "شنو أول استجابة آمنة؟",
    briefing: { title: "تحذير مفاجئ يقاطع عملك", scene: "أثناء ورشة، تظهر رسالة قفل الملفات على حاسوب المكتب. هذه محاكاة آمنة؛ لم تتأثر أي ملفات أو أجهزة.", linkLabel: "حاسوب التدريب · افحص التحذير", launchText: "افحص التحذير" },
    actions: [{ id: "isolate-report", label: "نفصل الجهاز عن الشبكة ونبلّغ فريق التقنية" }, { id: "pay-ransom", label: "ندفع الفدية فوراً" }, { id: "keep-working", label: "نتجاهل التحذير ونكمل العمل" }, { id: "restart-repeat", label: "نعيد التشغيل مرات كثيرة حتى تختفي الرسالة" }],
  },
  "network-defender": {
    title: "حارس الشبكة: اكتشف الدخيل", eyebrow: "السيناريو 7 · لاحظ الأنماط غير المعتادة",
    description: "تراجع شاشة نشاط خيالية للحرم الجامعي. اختر الحدث الذي يحتاج للتحقيق أولاً.",
    prompt: "أي حدث لازم فريق الأمن يحقق فيه أولاً؟",
    briefing: { title: "خذ دورك أمام شاشة المراقبة", scene: "أغلب النشاط طبيعي. راجع أربعة أحداث مبسطة وابحث عن النمط المختلف. ما تحتاجش معرفة تقنية.", linkLabel: "مراقب أمن الحرم · راجع أربعة أحداث", launchText: "راجع الأحداث" },
    actions: [{ id: "known-login", label: "دخول بوابة الطالب من جهاز جامعي معروف" }, { id: "university-download", label: "تنزيل دليل المقرر من موقع الجامعة" }, { id: "failed-login-burst", label: "٤٥ محاولة دخول فاشلة خلال دقيقة من مصدر مجهول" }, { id: "library-browsing", label: "تصفح عادي على حاسوب المكتبة" }],
  },
  "login-safety": {
    title: "صفحة تسجيل دخول مشبوهة", eyebrow: "السيناريو 1 · دقّق في العنوان",
    description: "الرابط فتح صفحة شكلها مثل بوابة الجامعة، لكن عنوان الموقع فيه تغيير صغير. هذه محاكاة آمنة، فلا تستخدم كلمة مرور حقيقية.",
    prompt: "هل الصفحة سليمة أم محاولة اختراق؟",
    briefing: { title: "رسالة تقول إن جلستك انتهت", scene: "وصلتك رسالة تقول إن جلسة بوابة الجامعة انتهت، ولازم تسجّل دخول من جديد حتى تفتح موادك.", linkLabel: "https://sms.u0t.edu.ly/eng/", launchText: "افتح الرابط" },
    actions: [{ id: "clean", label: "الصفحة سليمة" }, { id: "hack", label: "محاولة اختراق" }]
  },
  phishing: {
    title: "ملف رواتب ما كنتش متوقعه", eyebrow: "السيناريو 2 · مرفق بريد",
    description: "وصلك بريد فيه ملف رواتب، ولما تفتحه يطلب منك تفعيل الماكرو حتى يظهر المبلغ الجديد.",
    prompt: "شنو التصرف الأنسب؟",
    briefing: { title: "بريد جديد عن تعديل الراتب", scene: "الرسالة تقول إن فيه تعديل في راتب هذا الشهر، وإن التفاصيل موجودة في ملف Excel مرفق. الملف يطلب تفعيل الماكرو قبل ما يعرض المحتوى.", linkLabel: "Updated payroll statement.xlsm", launchText: "افتح الرسالة" },
    actions: [{ id: "enable-macros", label: "نفتح الملف ونفعّل الماكرو" }, { id: "report-attachment", label: "ما نفعّلهش؛ نتأكد من الجهة ونبلّغ" }]
  },
  "social-engineering": {
    title: "رسالة من «دعم الفعالية»", eyebrow: "السيناريو 3 · هندسة اجتماعية",
    description: "حساب خارجي يقول إنه من دعم الفعالية، ويحذرك إن حساب البطاقة بيتوقف. بعدها يطلب رمز الدخول المكوّن من ستة أرقام اللي وصلك على هاتفك.",
    prompt: "كيف تتصرف مع الرسالة؟",
    briefing: { title: "رسالة دعم وأنت تنتظر ورشة", scene: "وأنت واقف عند باب الورشة، وصلك كلام من حساب خارجي يعرف اسم الفعالية. يقول إن فيه مشكلة عاجلة في حساب بطاقتك وإن الدخول بيتقفل بعد دقائق.", linkLabel: "Teams · رسالة جديدة من دعم الفعالية", launchText: "افتح المحادثة" },
    actions: [{ id: "share-code", label: "نرسل الرمز قبل ما يتقفل الحساب" }, { id: "verify-request", label: "ما نرسلش الرمز، ونتواصل مع الدعم من القناة الرسمية" }, { id: "post-code", label: "ننشر الرمز في مجموعة الفعالية ونسألهم" }]
  },
  "url-safety": {
    title: "طلب موافقة ما درتاش أنت", eyebrow: "السيناريو 4 · إشعار تسجيل دخول",
    description: "هاتفك يطلع لك طلب موافقة على دخول ما بدأتهش، وبعدها يتصل شخص يقول إنه من الدعم ويطلب منك توافق.",
    prompt: "شنو تدير؟",
    briefing: { title: "إشعارات متكررة من تطبيق المصادقة", scene: "طلعوا لك أكثر من طلب موافقة على الهاتف، مع إنك مش قاعد تسجّل دخول. بعدها مباشرة جاك اتصال من شخص يقول إنه من الدعم ويبيك توافق على آخر طلب.", linkLabel: "Microsoft Authenticator · هل توافق على تسجيل الدخول؟", launchText: "راجع الإشعار" },
    actions: [{ id: "approve-request", label: "نوافق حتى يكمّل الدعم شغله" }, { id: "deny-and-report", label: "نرفض، نأمّن الحساب، ونبلّغ" }]
  },

};

export function localizeScenario(scenario: Scenario, language: Language): Scenario {
  const key = scenario.id === "wifi-trap" && scenario.actions.some((action) => action.id === "verify-with-staff") ? "wifi-trap-legacy" : scenario.id;
  if (language !== "ar" || !arabicScenarios[key]) return scenario;
  return { id: scenario.id, ...arabicScenarios[key] };
}

const arabicFeedback: Record<string, { correct: string; incorrect: string }> = {
  "wifi-trap": { correct: "صح. تستحق Campus_Guest_Free الحذر الأكبر في هذا الموقف الخيالي لأنها تتيح اتصالاً مفتوحاً لم يتم التحقق منه. هذا لا يجعلها خبيثة تلقائياً. كلمة المرور لا تجعل الشبكة موثوقة تلقائياً، ويمكن تقليد الاسم المألوف. قبل الاتصال بأي منها في الواقع، تأكد من معلومات الشبكة الرسمية من مصدر موثوق مثل موظفي المؤتمر المخولين.", incorrect: "Campus_Guest_Free هي الاختيار المقصود للحذر الأكبر هنا لأن اتصالها المفتوح لم يتم التحقق منه؛ هذا لا يثبت أنها خبيثة. كلمة المرور واسم الشبكة المألوف لا يثبتان شرعيتها أيضاً. تعامل بحذر مع الواي فاي العام غير المؤكد، وتحقق من المعلومات الرسمية من مصدر موثوق قبل الاتصال." },
  "wifi-trap-legacy": { correct: "صح. اسأل الموظفين المخولين عن اسم الشبكة وتعليمات الاتصال. يمكن للمهاجم تقليد اسم مألوف بشبكة وهمية. كلمة المرور أو قوة الإشارة لا تثبت الهوية، والشبكة المفتوحة ليست خبيثة تلقائياً.", incorrect: "تأكد من موظفي المؤتمر المخولين قبل الاتصال. يمكن للمهاجم تقليد اسم الشبكة؛ كلمة «رسمية» وكلمة المرور وقوة الإشارة لا تثبت الثقة. والشبكة المفتوحة ليست خبيثة تلقائياً." },
  "permission-detective": { correct: "صح. أعطِ التطبيق الصلاحيات التي يحتاجها لوظيفته فقط. الصلاحيات غير الضرورية ممكن تكشف معلوماتك الخاصة.", incorrect: "راجع حاجة التطبيق قبل الموافقة. الآلة الحاسبة ما تحتاجش الميكروفون أو جهات الاتصال أو الموقع." },
  ransomware: { correct: "صح. افصل الجهاز عن الشبكة وبلّغ فريق التقنية بسرعة للحد من الضرر. الدفع ما يضمنش استرجاع الملفات.", incorrect: "افصل الجهاز عن الشبكة وبلّغ فريق التقنية. تجنّب الدفع وإعادة التشغيل المتكررة واتبع تعليمات فريق الاستجابة." },
  "network-defender": { correct: "صح. كثرة محاولات الدخول الفاشلة من مصدر مجهول تستحق التحقيق. التنبيه دليل يحتاج مراجعة، مش إثبات لاختراق ناجح.", incorrect: "حقق في محاولات الدخول الفاشلة أولاً. تكرارها من مصدر مجهول ممكن يدل على محاولة دخول غير مصرح بها." },
  "login-safety": { correct: "صح. شكل الصفحة ممكن يتقلّد، لكن عنوان الموقع يفضحها: النطاق مكتوب بشكل مختلف عن عنوان الجامعة الحقيقي.", incorrect: "الصفحة مقلّدة. ركّز على عنوان الموقع الكامل؛ الشكل المألوف وحده ما يثبتش إن الصفحة أصلية." },
  phishing: { correct: "صح. ملف رواتب غير متوقع ويطلب تشغيل ماكرو ممكن ينفّذ كود ضار. تأكد من الموارد البشرية بطريقة ثانية وبلّغ عن الرسالة.", incorrect: "ما تفعّلش الماكرو في ملف جاك فجأة. اتصل بالجهة من قناة معروفة وبلّغ عن البريد." },
  "social-engineering": { correct: "صح. رمز الدخول خاص بك، والدعم الحقيقي ما يطلبش منك ترسله. اقفل المحادثة وتواصل مع الدعم من القناة الرسمية.", incorrect: "لا ترسل الرمز ولا تنشره. الشخص الثاني يقدر يستخدمه حتى يكمّل تسجيل الدخول باسمك. تواصل مع الدعم الرسمي مباشرة." },
  "url-safety": { correct: "صح. أنت ما بدأتش تسجيل الدخول والمكان مش معروف، وهذا ممكن يعني إن شخصاً عنده كلمة مرورك. ارفض الطلب، غيّر كلمة المرور، وبلّغ الدعم الرسمي.", incorrect: "لا توافق على طلب دخول ما بدأتهش. ارفضه، أمّن حسابك، وتواصل مع الدعم من رقم أو قناة رسمية." },
};

export function localizeFeedback(scenarioId: string, correct: boolean, language: Language, fallback: string, score?: number) {
  if (language === "ar" && score === 10 && ["permission-detective", "ransomware", "network-defender", "wifi-trap", "wifi-trap-legacy"].includes(scenarioId)) return `اختيار الإجراء صحيح، لكن التفسير المكتوب لا يوضح الدليل الأمني. خذيت نصف النقاط. ${arabicFeedback[scenarioId].correct.replace(/^صح\. /, "")}`;
  if (language === "ar" && score === 10) return "اختيارك صح، لكن السبب اللي كتبته ما يوضحش العلامة الأمنية المهمة. خذيت نصف النقاط؛ اذكر الدليل اللي لاحظته في الرسالة أو الصفحة.";
  return language === "ar" ? arabicFeedback[scenarioId]?.[correct ? "correct" : "incorrect"] ?? fallback : fallback;
}
