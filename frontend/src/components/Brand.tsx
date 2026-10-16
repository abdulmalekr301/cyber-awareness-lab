import { useLanguage } from "../i18n";

const departmentLogo = new URL("../assets/computer-engineering-logo.jpg", import.meta.url).href;

export function Brand() {
  const { isArabic } = useLanguage();
  return <div className="brand-lockup">
    <img src={departmentLogo} alt={isArabic ? "شعار قسم هندسة الحاسب" : "Computer Engineering Department logo"} className="brand-mark"/>
    <div className="brand-copy">
      <strong>{isArabic ? "جامعة طرابلس" : "University of Tripoli"}</strong>
      <span>{isArabic ? "كلية الهندسة · قسم هندسة الحاسب" : "Faculty of Engineering · Computer Engineering"}</span>
    </div>
  </div>;
}
