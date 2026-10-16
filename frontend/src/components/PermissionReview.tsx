import { useState } from "react";
import { ChevronDown, ContactRound, MapPin, Mic, Shield, Signal, Battery } from "lucide-react";

export function PermissionReview({ isArabic }: { isArabic: boolean }) {
  const [display, setDisplay] = useState("0");
  const permissions = [
    { icon: Mic, title: isArabic ? "الميكروفون" : "Microphone", detail: isArabic ? "الوصول إلى الميكروفون لتسجيل الصوت." : "Access the microphone to record audio." },
    { icon: ContactRound, title: isArabic ? "جهات الاتصال" : "Contacts", detail: isArabic ? "قراءة الأسماء وأرقام الهواتف في جهات اتصالك." : "Read names and phone numbers in your address book." },
    { icon: MapPin, title: isArabic ? "الموقع" : "Location", detail: isArabic ? "الوصول إلى موقع هذا الجهاز." : "Access this device’s location." },
  ];
  return <section className="permission-lab" aria-label={isArabic ? "مراجعة تثبيت QuickCalc+ الخيالي" : "Fictional QuickCalc+ installation review"}>
    <div className="permission-phone">
      <div className="permission-phone__status" dir="ltr"><span>9:41</span><span className="permission-phone__notch"/><span><Signal size={14}/><Battery size={17}/></span></div>
      <div className="permission-phone__body">
        <p className="mini-eyebrow">{isArabic ? "تثبيت تطبيق · محاكاة" : "App installation · simulation"}</p>
        <div className="quickcalc-app"><div className="quickcalc-icon" aria-label={isArabic ? "شعار QuickCalc+ الخيالي" : "Fictional QuickCalc+ icon"}><span>+</span><span>÷</span><span>×</span><span>=</span></div><div><h2>QuickCalc+</h2><p>{isArabic ? "آلة حاسبة بسيطة للحسابات اليومية" : "A simple calculator for everyday sums"}</p><span className="mini-chip">{isArabic ? "تطبيق خيالي" : "Fictional app"}</span></div></div>
        <div className="calculator-preview" aria-label={isArabic ? "معاينة الآلة الحاسبة" : "Calculator preview"} dir="ltr">
          <div className="calculator-preview__caption">{isArabic ? "معاينة تفاعلية فقط" : "Interactive preview only"}</div>
          <output aria-label={isArabic ? "شاشة الحاسبة" : "Calculator display"}>{display}</output>
          <div className="calculator-preview__keys">{["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "AC", "0", ".", "+"].map((key) => /^[0-9.]$/.test(key) || key === "AC"
            ? <button key={key} type="button" aria-label={key === "AC" ? (isArabic ? "مسح المعاينة" : "Clear preview") : `${isArabic ? "معاينة" : "Preview"} ${key}`} onClick={() => setDisplay((current) => key === "AC" ? "0" : current.length < 9 ? (current === "0" ? key : current + key) : current)}>{key}</button>
            : <span key={key} className="calculator-preview__operator" aria-hidden="true">{key}</span>)}</div>
        </div>
        <div className="permission-requests"><div className="permission-requests__heading"><Shield size={18}/><h3>{isArabic ? "الصلاحيات المطلوبة" : "Requested permissions"}</h3><span>03</span></div>
          {permissions.map(({ icon: Icon, title, detail }) => <details key={title}><summary><span className="permission-request-icon"><Icon size={20}/></span><span>{title}<small>{isArabic ? "اضغط لمراجعة الوصول" : "Tap to review access"}</small></span><ChevronDown size={17}/></summary><p>{detail}</p></details>)}
        </div>
        <p className="simulation-footnote">{isArabic ? "افحص الشاشة ثم اختر قرارك أدناه. لن تتغير أي صلاحيات على جهازك." : "Inspect the screen, then make your decision below. No device permissions are changed."}</p>
      </div>
    </div>
  </section>;
}
