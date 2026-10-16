import { useId } from "react";
import { Activity, ArrowUpRight, Check, Download, Globe2, Laptop, Monitor, Radio } from "lucide-react";

type Props = { actions: { id: string; label: string }[]; choice: string; onChoice: (id: string) => void; disabled: boolean; isArabic: boolean };
const eventDetails: Record<string, { time: string; source: string; sourceAr: string; category: string; categoryAr: string; detail: string; detailAr: string; icon: typeof Laptop }> = {
  "known-login": { time: "10:24:03", source: "Campus device · LAB-017", sourceAr: "جهاز جامعي · LAB-017", category: "Account access", categoryAr: "وصول للحساب", detail: "One successful portal login from a device already registered to the campus lab.", detailAr: "دخول ناجح واحد للبوابة من جهاز مسجل مسبقاً في معمل الجامعة.", icon: Laptop },
  "university-download": { time: "10:24:17", source: "Campus device · FAC-004", sourceAr: "جهاز جامعي · FAC-004", category: "File activity", categoryAr: "نشاط ملفات", detail: "One course guide downloaded from the university website to a campus laptop.", detailAr: "تنزيل دليل مقرر واحد من موقع الجامعة إلى حاسوب محمول جامعي.", icon: Download },
  "failed-login-burst": { time: "10:24:31", source: "Unknown external source", sourceAr: "مصدر خارجي مجهول", category: "Account access", categoryAr: "وصول للحساب", detail: "45 unsuccessful portal sign-ins were recorded from the same unknown source between 10:23:31 and 10:24:31.", detailAr: "سُجلت ٤٥ محاولة دخول غير ناجحة من نفس المصدر المجهول بين 10:23:31 و10:24:31.", icon: Globe2 },
  "library-browsing": { time: "10:24:48", source: "Campus device · LIB-012", sourceAr: "جهاز جامعي · LIB-012", category: "Web activity", categoryAr: "نشاط تصفح", detail: "A library workstation opened a normal browsing session for the library catalogue.", detailAr: "حاسوب المكتبة فتح جلسة تصفح عادية لفهرس المكتبة.", icon: Monitor },
};

export function NetworkMonitor({ actions, choice, onChoice, disabled, isArabic }: Props) {
  const gradient = useId().replace(/:/g, "");
  const selected = actions.find((action) => action.id === choice);
  const detail = selected ? eventDetails[selected.id] : undefined;
  return <section className="network-monitor" aria-label={isArabic ? "مراقب أمن شبكة الحرم الجامعي" : "Campus Network Security Monitor"}>
    <header className="network-monitor__header"><div className="network-monitor__brand"><span><Radio size={23}/></span><div><p className="mini-eyebrow">{isArabic ? "محطة المراقبة 01" : "Monitor station 01"}</p><h2>{isArabic ? "مراقب أمن شبكة الحرم الجامعي" : "Campus Network Security Monitor"}</h2></div></div><span className="mini-chip">{isArabic ? "بيانات تدريب خيالية" : "Fictional training data"}</span></header>
    <dl className="network-overview">
      {[{ label: isArabic ? "حالة العرض" : "Monitor status", value: isArabic ? "لقطة ثابتة" : "Snapshot" }, { label: isArabic ? "أجهزة جامعية" : "Campus devices", value: "03" }, { label: isArabic ? "نشاط مرصود" : "Observed actions", value: "48" }, { label: isArabic ? "أحداث للمراجعة" : "Event entries", value: "04" }].map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    <figure className="network-traffic"><figcaption><span><Activity size={17}/>{isArabic ? "النشاط في الدقيقة" : "Activity per minute"}</span><span>{isArabic ? "عينة خيالية · 10:19–10:24" : "Fictional sample · 10:19–10:24"}</span></figcaption>
      <svg viewBox="0 0 540 130" role="img" aria-label={isArabic ? "عينة نشاط تتغير من ٥ إلى ٤٨ إجراءً في الدقيقة" : "Sample activity varies from 5 to 48 actions per minute"}>
        <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#56cbd8" stopOpacity=".28"/><stop offset="100%" stopColor="#56cbd8" stopOpacity="0"/></linearGradient></defs>
        {[20, 60, 100].map((y) => <line key={y} x1="12" y1={y} x2="520" y2={y} stroke="#2a4357" strokeDasharray="4 5"/>)}
        <path d="M12 98 L112 94 L212 100 L312 96 L412 90 L512 18 L512 112 L12 112 Z" fill={`url(#${gradient})`}/><polyline points="12,98 112,94 212,100 312,96 412,90 512,18" fill="none" stroke="#6ed7e1" strokeWidth="3" strokeLinejoin="round"/>
        <circle cx="512" cy="18" r="4" fill="#6ed7e1"/><text x="500" y="10" fill="#c2d9e6" fontSize="10">48</text>
        {["10:19", "10:20", "10:21", "10:22", "10:23", "10:24"].map((time, index) => <text key={time} x={12 + index * 100} y="128" textAnchor={index === 0 ? "start" : "middle"} fill="#91a9bc" fontSize="10">{time}</text>)}
      </svg>
    </figure>
    <div className="network-events-heading"><h3>{isArabic ? "اختر الحدث الذي يحتاج للتحقيق أولاً" : "Choose the event to investigate first"}</h3><span>{isArabic ? "٤ أحداث · نفس الفترة" : "4 entries · same window"}</span></div>
    <div className="network-events">{actions.map((action, index) => {
      const event = eventDetails[action.id];
      const Icon = event.icon;
      const active = choice === action.id;
      return <button type="button" className={`network-event ${active ? "network-event--selected" : ""}`} key={action.id} aria-label={action.label} aria-pressed={active} onClick={() => onChoice(action.id)} disabled={disabled}>
        <span className="network-event__icon"><Icon size={20}/></span><span className="network-event__content"><span className="network-event__meta"><span>{isArabic ? event.categoryAr : event.category}</span><time dir="ltr">{event.time}</time></span><strong>{action.label}</strong><span className="network-event__source">{isArabic ? event.sourceAr : event.source}</span></span><span className="network-event__select" aria-hidden="true">{active ? <Check size={17}/> : <ArrowUpRight size={17}/>}</span><span className="sr-only">{isArabic ? `الحدث ${index + 1}` : `Event ${index + 1}`}</span>
      </button>;
    })}</div>
    <aside className="network-selected" aria-live="polite"><p className="mini-eyebrow">{isArabic ? "تفاصيل الحدث المحدد" : "Selected event details"}</p>{selected && detail ? <><h3>{selected.label}</h3><p>{isArabic ? detail.detailAr : detail.detail}</p></> : <p>{isArabic ? "اختر أي حدث لعرض تفاصيله، ثم اكتب تفسيرك أدناه." : "Select an event to inspect its details, then write your explanation below."}</p>}</aside>
  </section>;
}
