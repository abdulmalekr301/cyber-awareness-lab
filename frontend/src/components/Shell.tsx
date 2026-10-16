import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { LanguageToggle, useLanguage } from "../i18n";
export function Shell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const { isArabic } = useLanguage();
  return <main className="app-shell min-h-screen" dir={isArabic ? "rtl" : "ltr"}>
    <header className="site-header">
      <div className="site-header__inner">
        <Brand />
        <nav className="site-nav" aria-label={isArabic ? "التنقل الرئيسي" : "Main navigation"}>
          <a href="/">{isArabic ? "الرئيسية" : "Home"}</a>
          <a href="/#scenarios">{isArabic ? "السيناريوهات" : "Scenarios"}</a>
          <span>{isArabic ? "التوعية السيبرانية" : "Cyber awareness"}</span>
        </nav>
        <LanguageToggle />
      </div>
    </header>
    <div className={`site-content mx-auto w-full ${compact ? "max-w-3xl" : "max-w-6xl"} px-5 pb-16 pt-8 sm:px-8 sm:pt-12`}>{children}</div>
    <footer className="site-footer"><span>{isArabic ? "جامعة طرابلس · كلية الهندسة · قسم هندسة الحاسب" : "University of Tripoli · Faculty of Engineering · Computer Engineering"}</span><span>{isArabic ? "معرفة اليوم لأمان الغد" : "Learn today. Safer tomorrow."}</span></footer>
  </main>;
}
