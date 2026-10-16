import { describe, expect, it } from "vitest";
import { justificationMatches, normalizeJustification } from "./justification.js";

describe("justification keyword matching", () => {
  it("normalizes Arabic letters and diacritics", () => {
    expect(normalizeJustification("لأنَّ النِّطاق مُزَيَّف")).toBe("لان النطاق مزيف");
  });
  it.each([
    ["login-safety", "The hostname is a lookalike and uses u0t."],
    ["login-safety", "العنوان مقلد والنطاق غير رسمي"],
    ["phishing", "An unexpected XLSM attachment can contain malware."],
    ["phishing", "تفعيل الماكرو قد يشغل برنامج ضار"],
    ["social-engineering", "A one-time verification code is secret."],
    ["social-engineering", "رمز التحقق سري ولا يجب مشاركته"],
    ["url-safety", "I did not initiate this MFA request and the location is wrong."],
    ["url-safety", "لم أطلب تسجيل الدخول والموقع غير معروف"],
    ["phishing", "macros isn't needed for payroll document"],
    ["social-engineering", "never gives 2fa codes"],
    ["url-safety", "Microsoft support isn't in Poland"],
    ["social-engineering", "الدعم الحقيقي ما يطلبش رمز الدخول"],
    ["social-engineering", "هذا حساب خارجي ويطلب مني كود تسجيل الدخول"],
    ["phishing", "ملف الرواتب ما يحتاجش ماكرو"],
    ["url-safety", "ما درتش تسجيل دخول والمكان غريب"],
    ["login-safety", "الرابط غلط"],
    ["login-safety", "The web address seems incorrect"],
    ["phishing", "الامتداد غريب"],
    ["phishing", "This file format looks odd"],
    ["social-engineering", "ما ترسلش ال2fa لحد"],
    ["social-engineering", "Never give anyone the MFA code"],
    ["url-safety", "الموقع غريب"],
    ["url-safety", "The device location is suspicious"],
    ["login-safety", "الرابط مغلوط"],
    ["login-safety", "الوصلة موش طبيعية"],
    ["login-safety", "That address looks dodgy"],
    ["phishing", "الامتداد يشك في فايروس"],
    ["phishing", "ممكن الملف فيه فايروس"],
    ["phishing", "The attachment could be infected"],
    ["social-engineering", "لا ترسل أبداً أكواد الـMFA"],
    ["social-engineering", "متبعتش كود التحقق لأي حد"],
    ["social-engineering", "The codes are private and support does not need them"],
    ["url-safety", "هذا جهاز مش معروف"],
    ["url-safety", "محاولة الدخول موش مني"],
    ["url-safety", "I don't recognize this login attempt"],
    ["login-safety", "الرابط"],
    ["phishing", "مش متأكد من المصدر"],
    ["social-engineering", "المفروض انه ما يكلمش دعم يطلب مني بيانات تحقق"],
    ["url-safety", "Because it is fake account and i didnt contact with support or or login to my account"],
    ["phishing", "مالوير"],
    ["phishing", "الملف ممكن يكون فيه مالوير"],
  ])("accepts %s synonyms in either language", (scenarioId, text) => {
    expect(justificationMatches(scenarioId, text)).toBe(true);
  });
  it("rejects unrelated notes", () => expect(justificationMatches("phishing", "I just guessed this answer")).toBe(false));
  it("does not accept a missing CAPTCHA logo as evidence of the altered portal domain", () => {
    expect(justificationMatches("login-safety", "Google captcha's icon is missing")).toBe(false);
  });
  it.each([
    ["login-safety", "The page has nice colors"],
    ["phishing", "I do not like this email"],
    ["social-engineering", "I know what support is"],
    ["url-safety", "Microsoft is a company"],
    ["url-safety", "مارناش"],
    ["login-safety", "الرابط جميل"],
  ])("rejects vague reasoning for %s", (scenarioId, text) => {
    expect(justificationMatches(scenarioId, text)).toBe(false);
  });
});

describe("mini-game written reasoning", () => {
  it.each([
    ["permission-detective", "A calculator doesn't need my contacts to add numbers."],
    ["permission-detective", "Microphone access could let it spy on my conversations."],
    ["permission-detective", "Only give the app minimum necessary permissions."],
    ["permission-detective", "Location permissions could expose personal information."],
    ["permission-detective", "الحاسبة ما تحتاجش جهات الاتصال للحساب"],
    ["permission-detective", "الصلاحيات ممكن تكشف بياناتي الخاصة"],
    ["permission-detective", "الميكروفون ممكن يسجل كلامي ويتجسس علي"],
    ["permission-detective", "نعطي التطبيق اقل قدر من الصلاحيات"],
    ["ransomware", "Keep it offline to stop malware spreading to other devices."],
    ["ransomware", "Disconnecting can limit spread while IT handles the incident"],
    ["ransomware", "Paying the ransom does not guarantee recovery of our files."],
    ["ransomware", "The response team can arrange safe recovery."],
    ["ransomware", "نفصل الشبكة لمنع انتشار البرمجية لباقي الاجهزة"],
    ["ransomware", "الدفع ما يضمنش استرجاع الملفات"],
    ["ransomware", "نعزل الجهاز باش الفيروس ما ينتقلش لباقي الاجهزة"],
    ["network-defender", "So many failed logins could be someone guessing passwords."],
    ["network-defender", "45 failed password attempts look like a brute force attack."],
    ["network-defender", "Repeated failed logins may indicate an intrusion."],
    ["network-defender", "محاولات الدخول الفاشلة المتكررة قد تدل على تخمين كلمات المرور"],
    ["network-defender", "محاولات دخول فاشلة كثيرة خلال دقيقة ممكن تكون هجوم"],
    ["network-defender", "٤٥ محاولة دخول فاشلة بسرعة ممكن تكون محاولة اختراق"],
  ])("accepts relevant English/Arabic paraphrases for %s: %s", (id, reason) => {
    expect(justificationMatches(id, reason)).toBe(true);
  });

  it.each([
    ["permission-detective", "Review the permissions and refuse unnecessary access"],
    ["permission-detective", "نراجع الصلاحيات ونرفض الوصول غير الضروري"],
    ["ransomware", "Disconnect the device from the network and report it to IT"],
    ["ransomware", "نفصل الجهاز عن الشبكة ونبلّغ فريق التقنية"],
    ["network-defender", "45 failed logins in one minute from an unknown source"],
    ["network-defender", "٤٥ محاولة دخول فاشلة خلال دقيقة من مصدر مجهول"],
    ["permission-detective", "The calculator has nice colors and I like it"],
    ["permission-detective", "privacyprivacy contactscontacts"],
    ["ransomware", "Malware is something that exists"],
    ["ransomware", "Disconnecting allows malware to spread"],
    ["ransomware", "Paying guarantees recovery of our files"],
    ["network-defender", "Repeated failed logins are not an attack and not suspicious"],
    ["network-defender", "The library looks nicer"],
    ["network-defender", "guessing guessing guessing"],
    ["permission-detective", "<script>A calculator does not need microphone access</script>"],
  ])("rejects repeated answers, irrelevant text or contradictions for %s: %s", (id, reason) => {
    expect(justificationMatches(id, reason)).toBe(false);
  });
});

describe("Wi-Fi Trap written reasoning", () => {
  it.each([
    "I would be cautious because the network is unverified",
    "Public Wi-Fi brings privacy risks without checking who operates it",
    "I must verify the network is official before trusting it",
    "The open network needs a check before connecting",
    "هذه شبكة غير مؤكدة لذلك أتعامل معها بحذر",
    "الشبكة المفتوحة فيها مخاطر على الخصوصية",
    "لازم نتحقق من هوية الشبكة قبل الوثوق فيها",
    "مش متأكد انها رسمية ونحتاج نتحقق من الشبكة",
  ])("accepts a caution or verification rationale: %s", (reason) => {
    expect(justificationMatches("wifi-trap", reason, 4)).toBe(true);
  });
  it.each([
    "It has no password", "No password required", "Campus_Guest_Free", "لانها بدون كلمة مرور", "لا تحتاج كلمة مرور",
    "Open means malicious so I should verify the network identity",
    "كل الشبكات المفتوحة شريرة لذلك نتحقق من هوية الشبكة",
  ])("does not give full credit for a password observation or an overclaim: %s", (reason) => {
    expect(justificationMatches("wifi-trap", reason, 4)).toBe(false);
  });
  it("keeps version-3 reasoning rules while expanding only the version-4 Wi-Fi question", () => {
    expect(justificationMatches("wifi-trap", "Verify the official network information with conference staff before connecting", 3)).toBe(false);
    expect(justificationMatches("wifi-trap", "The open network needs a check before connecting", 3)).toBe(false);
    expect(justificationMatches("wifi-trap", "An attacker can copy a network name", 3)).toBe(true);
  });
  it.each([
    "An attacker can copy a network name, so I cannot trust the name alone",
    "The Wi-Fi name can be fake even if it looks like the campus network",
    "Someone can create a hotspot with the same name",
    "A password does not prove the network is safe",
    "A strong signal is not proof of identity",
    "Staff are a trusted source who can confirm which network belongs to the university",
    "A rogue hotspot may intercept my data",
    "The word Official does not mean the network is legitimate",
    "اسم الشبكة ممكن يتقلد من مهاجم",
    "ممكن شبكة وهمية تظهر بنفس الاسم",
    "كلمة المرور مش دليل ان الشبكة موثوقة",
    "قوة الاشارة لا تثبت هوية الشبكة",
    "موظفي المؤتمر مصدر موثوق لتوثيق هوية الشبكة",
    "الشبكة الوهمية ممكن تسرق بياناتي",
  ])("accepts English/Arabic Wi-Fi explanations: %s", (reason) => {
    expect(justificationMatches("wifi-trap", reason)).toBe(true);
  });
  it.each([
    "I like the colors",
    "It is the strongest signal",
    "It asks for a password so I trust it",
    "All open networks are malicious",
    "A password proves it is safe even though a network name can be fake",
    "اسمها جميل",
    "كل الشبكات المفتوحة خبيثة",
    "wifiwifi fakefake passwordpassword",
  ])("rejects weak reasoning, answer repetition and overclaims: %s", (reason) => {
    expect(justificationMatches("wifi-trap", reason)).toBe(false);
  });
});
