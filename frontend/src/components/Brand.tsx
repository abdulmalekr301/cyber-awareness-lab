import { useLanguage } from "../i18n";
export function Brand() {
  const { isArabic } = useLanguage();
  return <div className="brand-lockup">
    <img src="/computer-engineering-logo.png" alt={isArabic ? "شعار قسم هندسة الحاسب" : "Computer Engineering Department logo"} className="brand-mark"/>
    <div className="brand-copy">
      <strong>{isArabic ? "جامعة طرابلس" : "University of Tripoli"}</strong>
      <span>{isArabic ? "كلية الهندسة · قسم هندسة الحاسب" : "Faculty of Engineering · Computer Engineering"}</span>
    </div>
  </div>;
}
