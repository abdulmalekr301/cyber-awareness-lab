type EvidenceRule = {
  phrases: string[];
  concepts?: string[][][];
  standalone?: string[];
};

// These rules use the same local concept-group approach as the original games.
// They require a security rationale, rather than merely restating an action.
const writtenMiniGameRules: Record<string, EvidenceRule & { contradictions: string[] }> = {
  "wifi-trap": {
    phrases: [],
    concepts: [
      [["network name", "wifi name", "wi fi name", "SSID", "network names", "wifi names", "wi fi names", "اسم الشبكة", "اسم شبكة", "اسم الواي فاي", "اسماء الشبكات", "اسم الشبكات", "الاسم"],
       ["copied", "copy", "fake", "impersonate", "spoof", "imitate", "does not prove", "not proof", "not enough", "can be faked", "مقلد", "تقليد", "يتقلد", "ينتحل", "تزوير", "مزيف", "مزيفة", "لا يثبت", "مش دليل", "ممكن يتزور"]],
      [["network", "networks", "wifi", "wi fi", "hotspot", "access point", "الشبكة", "شبكة", "الشبكات", "الواي فاي", "نقطة اتصال"],
       ["evil twin", "rogue", "impersonation", "same name", "lookalike", "انتحال", "تنتحل", "نفس الاسم", "تقلد", "وهمية", "وهمية بنفس", "مزيفة باسم"]],
      [["password", "padlock", "strong signal", "official", "كلمة مرور", "كلمة المرور", "قفل", "قوة الاشارة", "اشارة قوية", "رسمية", "رسمي"],
       ["does not prove", "doesnt prove", "doesn t prove", "does not mean", "doesnt mean", "doesn t mean", "not proof", "not enough", "no guarantee", "does not guarantee", "لا يثبت", "لا تثبت", "مش دليل", "ما يضمنش", "لا يضمن", "ما تعنيش", "لا تعني"],
       ["safe", "trust", "identity", "legitimate", "secure", "real", "موثوقة", "موثوق", "امنة", "امن", "الهوية", "هوية", "حقيقية"]],
      [["staff", "organizers", "organisers", "university representative", "الموظفين", "الموظفون", "موظفي المؤتمر", "موظفين", "المنظمين", "الجامعة"],
       ["trusted source", "confirm identity", "verify identity", "which network is real", "which network belongs", "can confirm", "know the real", "مصدر موثوق", "يؤكدوا هوية", "يتاكدوا من هوية", "يعرفوا الشبكة الحقيقية", "يقدروا ياكدوا", "يؤكدون", "لتوثيق الهوية"]],
      [["network", "wifi", "wi fi", "hotspot", "شبكة", "الشبكة", "الواي فاي"],
       ["steal", "intercept", "spy", "capture", "تسرق", "يسرق", "تتجسس", "يعترض", "تعترض"],
       ["data", "passwords", "traffic", "بيانات", "البيانات", "كلمات المرور", "بياناتي"]],
    ],
    contradictions: ["open wifi is always malicious", "open wi fi is always malicious", "all open networks are malicious", "a password proves it is safe", "official means safe", "a strong signal proves", "كل الشبكات المفتوحة خبيثة", "كلمة المرور تثبت انها امنة", "كلمة رسمية تعني امنة"],
  },
  "permission-detective": {
    phrases: [],
    concepts: [
      [["calculator", "calculations", "doing sums", "add numbers", "basic arithmetic", "math", "maths", "calculate", "حاسبة", "الحاسبة", "حاسبه", "الحاسبه", "الحساب", "حسابات"],
       ["microphone", "mic", "contacts", "location", "الميكروفون", "ميكروفون", "جهات الاتصال", "الموقع", "موقع", "المايك"],
       ["does not need", "doesnt need", "doesn t need", "not needed", "unnecessary", "not required", "unrelated", "no reason", "nothing to do with", "only needs", "excessive", "ما تحتاجش", "ما يحتاجش", "لا تحتاج", "لا يحتاج", "مش محتاج", "غير ضروري", "غير ضرورية", "مالهاش علاقة", "مش لازمة", "ما يلزمش"]],
      [["permissions", "access", "microphone", "mic", "contacts", "location", "الصلاحيات", "صلاحيات", "الميكروفون", "المايك", "جهات الاتصال", "الموقع"],
       ["privacy risk", "expose private", "expose my data", "expose personal", "collect personal", "steal data", "spy on", "track me", "record conversations", "listen to me", "protect my privacy", "personal information", "خطر على الخصوصية", "تكشف بيانات", "تجمع معلومات", "يتجسس", "ويتجسس", "يسجل كلامي", "تتجسس", "يتتبعني", "تتبع موقعي", "تسجل كلامي", "معلوماتي الخاصة", "بياناتي الخاصة", "حماية خصوصيتي"]],
      [["least privilege", "minimum necessary", "only the access it needs", "اقل صلاحيات", "اقل قدر من الصلاحيات", "الصلاحيات الضرورية فقط"],
       ["app", "calculator", "access", "permissions", "التطبيق", "تطبيق", "حاسبة", "الصلاحيات", "صلاحيات"]],
    ],
    contradictions: ["all permissions are safe", "privacy does not matter", "calculator needs my microphone", "كل الصلاحيات امنة", "الخصوصية مش مهمة"],
  },
  ransomware: {
    phrases: [],
    concepts: [
      [["spread", "spreading", "infect other", "reach other", "انتشار", "الانتشار", "ينتشر", "ينتشرش", "ينتقل", "ينتقلش", "ينتقل لباقي"],
       ["stop", "prevent", "limit", "contain", "cannot", "can t", "wont", "won t", "avoid", "keep it from", "does not spread", "doesn t spread", "نمنع", "منع", "لمنع", "نوقف", "ايقاف", "يحد", "الحد", "ما ينتشرش", "ما ينتقلش", "ما تنتقلش", "ما تنتشرش"],
       ["network", "devices", "computers", "machines", "disconnecting", "disconnection", "isolation", "malware", "ransomware", "infection", "الشبكة", "الشبكه", "الاجهزة", "الاجهزه", "باقي الاجهزة", "الفيروس", "البرمجية", "البرمجيات", "العدوى"]],
      [["pay", "paying", "payment", "ransom", "الدفع", "دفع", "الفدية", "فدية"],
       ["no guarantee", "does not guarantee", "doesnt guarantee", "doesn t guarantee", "may not restore", "might not restore", "not guaranteed", "ما يضمنش", "لا يضمن", "مش مضمون", "غير مضمون"],
       ["files", "recovery", "restore", "الملفات", "ملفات", "استرجاع", "استعادة", "ترجع"]],
      [["IT", "response team", "security team", "فريق التقنية", "فريق الامن", "فريق الاستجابة"],
       ["contain malware", "safe recovery", "recover safely", "prevent spread", "احتواء الحادث", "احتواء البرمجية", "استعادة امنة", "استرجاع امن", "منع الانتشار"]],
    ],
    contradictions: ["paying guarantees", "payment guarantees", "ransom guarantees", "الدفع يضمن دائما", "الفدية تضمن دائما"],
  },
  "network-defender": {
    phrases: [],
    concepts: [
      [["failed login", "failed logins", "failed sign in", "unsuccessful login", "failed password", "failed passwords", "دخول فاشلة", "الدخول الفاشلة", "دخول فاشل", "فشل تسجيل الدخول", "محاولات فاشلة", "محاولات الدخول"],
       ["many", "repeated", "repeatedly", "burst", "45", "٤٥", "rapid", "frequent", "so many", "متكررة", "المتكررة", "متكرر", "المتكرر", "كثيرة", "كثير", "خلال دقيقة", "بسرعة"],
       ["brute force", "password guessing", "guessing passwords", "guess passwords", "trying passwords", "trying to gain access", "automated attack", "intrusion", "break in", "unauthorized", "attack attempt", "تخمين", "يخمن", "يحاول يخمن", "هجوم", "اختراق", "دخول غير مصرح", "دخول بدون اذن"]],
    ],
    contradictions: ["not an attack", "not suspicious", "not an intrusion", "no investigation needed", "مش هجوم", "مش مشبوه", "لا يحتاج تحقيق", "ليس اختراق"],
  },
};

// Preserve version 3's reasoning contract; only the new caution question gets
// these additional English/Arabic concept groups.
const wifiCautionRule = {
  ...writtenMiniGameRules["wifi-trap"],
  concepts: [
    ...writtenMiniGameRules["wifi-trap"].concepts!,
    [["network", "networks", "wifi", "wi fi", "hotspot", "شبكة", "الشبكة", "شبكات", "الشبكات", "الواي فاي"],
     ["unverified", "not verified", "without verification", "unconfirmed", "unknown owner", "unknown operator", "not sure it is official", "unsure whether it is official", "do not know if it is official", "غير مؤكدة", "غير موثقة", "لم يتم التحقق", "دون التحقق", "بدون تحقق", "ما نعرفش صاحبها", "مش متأكد انها رسمية", "موش متأكد انها رسمية"]],
    [["open network", "open wifi", "open wi fi", "public network", "public wifi", "public wi fi", "open networks", "public networks", "شبكة مفتوحة", "الشبكة المفتوحة", "شبكة عامة", "الشبكات العامة", "الشبكات المفتوحة", "واي فاي عام"],
     ["risk", "risks", "risky", "privacy", "interception", "verify", "check", "cautious", "caution", "خطر", "مخاطر", "الخصوصية", "خصوصيتي", "حذر", "بحذر", "نتأكد", "تحقق", "التحقق"]],
    [["network", "wifi", "wi fi", "hotspot", "SSID", "شبكة", "الشبكة", "الواي فاي", "شبكات", "الشبكات"],
     ["verify", "check", "confirm", "verification", "نتأكد", "التأكد", "نتحقق", "تحقق", "التحقق"],
     ["legitimacy", "legitimate", "official", "identity", "owner", "trusted source", "before trusting", "before i trust", "شرعيتها", "شرعية", "رسمية", "الرسمية", "هوية", "هويتها", "مصدر موثوق", "قبل الثقة", "قبل الوثوق"]],
  ],
  contradictions: [
    ...writtenMiniGameRules["wifi-trap"].contradictions,
    "open networks are always malicious", "open means malicious", "no password means malicious", "no password proves it is malicious", "all open networks are evil", "a password makes it trustworthy",
    "الشبكات المفتوحة دائما خبيثة", "بدون كلمة مرور يعني خبيثة", "كل الشبكات المفتوحة شريرة",
  ],
};

const evidenceRules: Record<string, EvidenceRule> = {
  "login-safety": { standalone: ["الرابط", "اللينك", "النطاق", "الدومين"], phrases: [
    "wrong url", "fake url", "bad url", "incorrect url", "altered url", "url is different", "url looks off", "url looks weird", "url isnt real", "url is not real", "lookalike url", "web address", "wrong address", "fake address", "different address", "suspicious address", "domain", "hostname", "host name", "u0t", "zero instead of o", "letter replaced", "misspelled", "typo", "lookalike", "spoofed", "cloned site", "not official", "not the university site", "does not belong to the university",
    "الرابط مش حقيقي", "الرابط مزيف", "الرابط مقلد", "الرابط مختلف", "الرابط غلط", "الرابط مغلوط", "الرابط خاطي", "الرابط موش صح", "الرابط مش طبيعي", "اللينك غلط", "اللينك مضروب", "اللينك مشبوه", "الوصله غلط", "عنوان الموقع", "العنوان مختلف", "العنوان غلط", "العنوان مشبوه", "النطاق", "الدومين", "اسم الموقع", "اسم المضيف", "صفر بدل حرف", "حرف متبدل", "مكتوب غلط", "خطا في الرابط", "محرف", "مقلد", "مزور", "مش رسمي", "موش رسمي", "مش تابع للجامعه", "موش تابع للجامعه", "ليس تابع للجامعه"
  ], concepts: [
    [["url", "link", "domain", "hostname", "address", "رابط", "لينك", "وصله", "نطاق", "دومين", "عنوان", "اسم الموقع"], ["wrong", "fake", "false", "altered", "different", "suspicious", "invalid", "not real", "not official", "غلط", "مزيف", "مقلد", "محرف", "مختلف", "مشبوه", "غير صحيح", "مش حقيقي", "مش رسمي"]],
    [["u0t", "zero", "0", "صفر"], ["instead", "replaced", "بدل", "مكان"]],
  ] },
  phishing: { phrases: [
    "macro", "macros", "macro enabled", "enable content", "enable editing", "xlsm", "executable content", "malware", "malicious code", "unsafe code", "virus", "could be a virus", "might contain a virus", "infected file", "dangerous file", "odd extension", "weird extension", "unusual file type", "unexpected attachment", "suspicious attachment", "strange attachment", "unexpected spreadsheet", "unknown download", "payroll does not need macros", "payroll document", "verify payroll", "verify sender", "report attachment",
    "ماكرو", "الماكرو", "تفعيل المحتوي", "تفعيل المحتوى", "تفعيل التحرير", "ملف رواتب غير متوقع", "مرفق غير متوقع", "مرفق مشبوه", "مرفق غريب", "ملف مشبوه", "ملف غريب", "الامتداد غريب", "الامتداد مشبوه", "الامتداد يشك", "صيغه الملف غريبه", "نوع الملف غريب", "نوع الملف مش معروف", "كود ضار", "برنامج ضار", "برمجيه خبيثه", "برمجيات خبيثه", "مالوير", "ملوير", "مالوار", "فيروس", "فايروس", "فيه فيروس", "ممكن فيه فيروس", "يحتوي فيروس", "ملف مصاب", "ينزل فيروس", "نتاكد من الموارد البشريه", "نتاكد من المرسل", "التحقق من المرسل", "نبلغ عن المرفق", "الماكرو مش مطلوب", "الرواتب ما تحتاجش ماكرو", "مش متاكد من المصدر", "موش متاكد من المصدر", "المصدر مش معروف", "المصدر موش معروف", "المصدر غير موثوق", "مش عارف المصدر", "مصدر مجهول", "المرسل مش مضمون", "المرسل غير موثوق"
  ], concepts: [
    [["attachment", "file", "spreadsheet", "extension", "format", "macro", "xlsm", "مرفق", "ملف", "جدول", "امتداد", "صيغه", "نوع الملف", "ماكرو"], ["suspicious", "strange", "odd", "unexpected", "unknown", "unsafe", "malicious", "malware", "dangerous", "infected", "virus", "not needed", "مشبوه", "غريب", "غير متوقع", "مجهول", "ضار", "خبيث", "مالوير", "ملوير", "مالوار", "خطير", "فيروس", "مصاب", "مش مطلوب", "ما يحتاجش"]],
    [["sender", "source", "payroll", "human resources", "مرسل", "مصدر", "رواتب", "موارد بشريه"], ["verify", "confirm", "report", "unsure", "uncertain", "unknown", "untrusted", "اتاكد", "نتاكد", "تحقق", "نبلغ", "ابلاغ", "مش متاكد", "موش متاكد", "مش معروف", "غير موثوق", "مجهول", "مش مضمون"]],
  ] },
  "social-engineering": { phrases: [
    "otp", "2fa code", "2fa codes", "mfa code", "mfa codes", "two factor code", "authentication code", "one time code", "one time password", "verification code", "security code", "sign in code", "login code", "code is secret", "code is private", "codes are personal", "do not share the code", "never share code", "never send code", "never give code", "nobody needs my code", "support should not ask", "support never asks", "asking for my code", "account takeover", "external user", "impersonating support", "fake support", "verify with official support",
    "رمز التحقق", "رمز الدخول", "رمز الامان", "رمز مؤقت", "رمز لمره واحده", "رمز من سته ارقام", "اكواد التحقق", "اكواد ال2fa", "اكواد الmfa", "بيانات تحقق", "معلومات تحقق", "بيانات المصادقه", "معلومات المصادقه", "الرمز سري", "الرمز خاص", "الكود شخصي", "ما نعطيش الرمز", "ما نرسلش الرمز", "ما نبعتش الكود", "ما ترسلش الرمز", "لا ترسل الرمز", "لا ترسل اكواد", "ما ترسلش ال2fa", "لا ترسل الmfa", "ممنوع نشارك الكود", "لا اشارك الرمز", "لا اعطي الرمز", "عدم مشاركه الرمز", "محدش يحتاج الكود", "الدعم ما يطلبش الرمز", "الدعم لا يطلب الرمز", "الدعم الحقيقي ما يطلبش", "الدعم ما يطلبش بيانات تحقق", "الدعم لا يطلب بيانات تحقق", "ما يكلمش دعم يطلب بيانات تحقق", "دعم يطلب مني بيانات تحقق", "موظف الدعم يطلب معلومات تحقق", "سرقه الحساب", "حساب خارجي", "منتحل صفه الدعم", "دعم مزيف", "نتاكد من الدعم الرسمي", "نتواصل مع الدعم الرسمي"
  ], concepts: [
    [["otp", "2fa", "mfa", "verification code", "security code", "login code", "one time code", "code", "رمز", "كود", "شفرة"], ["secret", "private", "do not share", "dont share", "never share", "do not send", "dont send", "never send", "do not give", "dont give", "never give", "should not ask", "سري", "خاص", "ما نشاركش", "ما نرسلش", "ما ترسلش", "ما نعطيش", "لا نشارك", "لا نرسل", "لا نعطي", "ما يطلبش", "عدم مشاركه"]],
    [["support", "agent", "caller", "الدعم", "موظف", "متصل"], ["fake", "impersonating", "external", "unverified", "مزيف", "منتحل", "خارجي", "مش معروف"]],
    [["support", "agent", "الدعم", "موظف"], ["ask", "request", "طلب", "يطلب", "يبي"], ["verification data", "verification info", "authentication data", "بيانات تحقق", "معلومات تحقق", "بيانات المصادقه", "معلومات المصادقه", "رمز", "كود"]],
  ] },
  "url-safety": { phrases: [
    "unexpected mfa", "mfa request", "mfa prompt", "2fa request", "two factor request", "approval request", "random approval", "sign in request", "login attempt", "unrecognized login", "did not request", "didnt request", "did not initiate", "did not approve", "not my login", "wasnt me", "not me", "unknown location", "wrong location", "different location", "suspicious location", "new device", "unknown device", "warsaw", "poland", "microsoft support isnt in poland", "did not contact support", "unexpected support call", "deny the request", "reject the request", "change password", "secure the account",
    "طلب مصادقه", "طلب موافقه", "موافقه عشوائيه", "طلب تسجيل دخول", "محاوله دخول", "دخول مجهول", "ما طلبتش", "ما درتش تسجيل دخول", "لم اطلب", "لم ابدا", "ما وافقتش", "مش انا", "موش انا", "ليس انا", "مكان غريب", "مكان مش معروف", "موقع غريب", "الموقع غريب", "موقع مشبوه", "موقع غير معروف", "بلد غريب", "مدينه غريبه", "جهاز غريب", "جهاز مش معروف", "وارسو", "بولندا", "ما اتصلتش بالدعم", "لم اتصل بالدعم", "اتصال دعم مفاجي", "نرفض الطلب", "ارفض الطلب", "نسكر الطلب", "نغير كلمه المرور", "تامين الحساب", "نامن الحساب", "did not contact with support", "didnt contact support", "didnt contact with support", "did not log in", "did not login", "didnt log in", "didnt login", "i never contacted support", "i never logged in", "fake support account", "fake account and i did not contact support"
  ], concepts: [
    [["mfa", "2fa", "approval", "request", "sign in", "login", "prompt", "مصادقه", "موافقه", "طلب", "دخول", "تسجيل"], ["unexpected", "unknown", "not mine", "not me", "did not request", "didnt request", "strange", "wrong", "مفاجي", "مجهول", "مش انا", "موش انا", "مش مني", "موش مني", "ما طلبتش", "لم اطلب", "غريب", "غلط"]],
    [["location", "country", "city", "device", "ip", "موقع", "مكان", "بلد", "مدينه", "جهاز", "عنوان"], ["unknown", "strange", "wrong", "different", "suspicious", "غير معروف", "غريب", "غلط", "مختلف", "مشبوه"]],
  ] },

};

export function normalizeJustification(value: string) {
  return value.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/ـ/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ")
    .replace(/فايروسات|فايروس|ڤيروسات|ڤيروس|فيروسات/g, "فيروس")
    .replace(/اكواد|كودات|شفرات/g, "رموز")
    .replace(/مغلوطه|مغلوط|غلطانه|غلطان|خاطيه|خاطي|باطله|باطل/g, "غلط")
    .replace(/موش طبيعيه|مش طبيعيه|غير طبيعيه|موش طبيعي|مش طبيعي|غير طبيعي/g, "مشبوه")
    .replace(/مريبه|مريب|يثير الشك|يشككني|شكله يشك/g, "مشبوه")
    .replace(/متبعتش|ما تبعتش|ما نبعتش|متبعثش|ما تبعثش/g, "لا نرسل")
    .replace(/مترسلش|ما ترسلش|لا ترسل|ممنوع ترسل/g, "لا نرسل")
    .replace(/متشاركش|ما تشاركش|لا تشارك|ممنوع تشارك/g, "لا نشارك")
    .replace(/متديش|ما تديش|متعطيش|ما تعطيش|لا تعطي/g, "لا نعطي")
    .replace(/\burls\b/g, "url").replace(/\blinks\b/g, "link").replace(/\bdomains\b/g, "domain")
    .replace(/\battachments\b/g, "attachment").replace(/\bfiles\b/g, "file").replace(/\bcodes\b/g, "code")
    .replace(/\bbogus\b|\bphony\b|\bphoney\b/g, "fake").replace(/\bdodgy\b|\bsketchy\b/g, "suspicious");
}

export function justificationMatches(scenarioId: string, justification: string, scenarioVersion?: number) {
  const normalized = normalizeJustification(justification);
  const writtenRule = scenarioId === "wifi-trap" && scenarioVersion !== 3 ? wifiCautionRule : writtenMiniGameRules[scenarioId];
  if (writtenRule) {
    // Match whole normalized words/phrases, not a keyword hidden inside another
    // word or markup. This is deterministic evidence matching, not semantic AI.
    if (/<[^>]*>/.test(justification)) return false;
    const contains = (term: string) => ` ${normalized} `.includes(` ${normalizeJustification(term)} `);
    if (writtenRule.contradictions.some(contains)) return false;
    return writtenRule.concepts?.some((pattern) => pattern.every((alternatives) => alternatives.some(contains))) ?? false;
  }
  const rule = evidenceRules[scenarioId];
  if (!rule) return false;
  if (rule.standalone?.some((term) => normalized === normalizeJustification(term))) return true;
  if (normalized.length < 5) return false;
  if (rule.phrases.some((phrase) => normalized.includes(normalizeJustification(phrase)))) return true;
  return rule.concepts?.some((pattern) => pattern.every((alternatives) =>
    alternatives.some((term) => normalized.includes(normalizeJustification(term)))
  )) ?? false;
}
