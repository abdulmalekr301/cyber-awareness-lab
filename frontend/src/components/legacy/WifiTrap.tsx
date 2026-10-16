import { Battery, Check, ChevronLeft, LockKeyhole, LockKeyholeOpen, Signal, UsersRound, Wifi } from "lucide-react";
import { WifiSignal } from "../WifiSignal";

type Props = { actions: { id: string; label: string }[]; choice: string; onChoice: (id: string) => void; disabled: boolean; isArabic: boolean };
const networks = [
  { action: "connect-campus", name: "Campus_WiFi", protected: true, strength: 3 },
  { action: "connect-free", name: "Campus_Free_WiFi", protected: false, strength: 4 },
  { action: "connect-official", name: "Campus_WiFi_Official", protected: true, strength: 2 },
];

export function LegacyWifiTrap({ actions, choice, onChoice, disabled, isArabic }: Props) {
  const selected = networks.find((network) => network.action === choice);
  const verification = actions.find((action) => action.id === "verify-with-staff")!;
  return <section className="wifi-lab" aria-label={isArabic ? "محاكاة اختيار شبكة الواي فاي" : "Simulated Wi-Fi selection"}>
    <div className="wifi-phone">
      <div className="wifi-phone__status" dir="ltr"><span>9:41</span><span className="wifi-phone__notch"/><span><Signal size={14}/><Battery size={17}/></span></div>
      <div className="wifi-phone__body">
        <div className="wifi-settings-back"><ChevronLeft size={17}/>{isArabic ? "الإعدادات" : "Settings"}</div>
        <div className="wifi-settings-title"><span><Wifi size={28}/></span><div><h2>{isArabic ? "الواي فاي" : "Wi-Fi"}</h2><p>{isArabic ? "شاشة تدريب خيالية" : "Fictional training screen"}</p></div></div>
        <div className="wifi-settings-status"><span>{isArabic ? "الشبكات المتاحة" : "Available networks"}</span><span className="wifi-simulated-badge">{isArabic ? "محاكاة" : "Simulated"}</span></div>
        <div className="wifi-networks">{networks.map((network) => {
          const action = actions.find((action) => action.id === network.action)!;
          const active = choice === action.id;
          const Lock = network.protected ? LockKeyhole : LockKeyholeOpen;
          const protection = network.protected ? (isArabic ? "تحتاج كلمة مرور" : "Password required") : (isArabic ? "لا تحتاج كلمة مرور" : "No password required");
          return <button type="button" key={action.id} className={`wifi-network ${active ? "wifi-network--selected" : ""}`} aria-label={action.label} aria-pressed={active} onClick={() => onChoice(action.id)} disabled={disabled}>
            <WifiSignal strength={network.strength} isArabic={isArabic}/>
            <span className="wifi-network__name"><strong dir="ltr">{network.name}</strong><small><Lock size={13}/>{protection}</small></span>
            <span className="wifi-network__selection" aria-hidden="true">{active ? <Check size={16}/> : <span/>}</span>
          </button>;
        })}</div>
        <div className="wifi-selection-summary" aria-live="polite">
          <span>{isArabic ? "الإجراء المحدد" : "Selected action"}</span>
          <p>{selected ? (isArabic ? `الاتصال بشبكة ${selected.name}` : `Connect to ${selected.name}`) : choice === verification.id ? (isArabic ? "التحقق مع موظفي المؤتمر" : "Verify with conference staff") : (isArabic ? "لم تحدد إجراءً بعد" : "No action selected yet")}</p>
        </div>
        <p className="wifi-simulation-note">{isArabic ? "اختيار تدريبي فقط. لن يتصل جهازك بأي شبكة، ولن نطلب كلمة مرور." : "Training selection only. Your device will not connect to a network, and no password is requested."}</p>
      </div>
    </div>
    <div className="wifi-alternative"><span className="mini-eyebrow">{isArabic ? "إجراء آخر متاح" : "Another available action"}</span>
      <button type="button" className={`wifi-staff-action ${choice === verification.id ? "wifi-staff-action--selected" : ""}`} aria-pressed={choice === verification.id} onClick={() => onChoice(verification.id)} disabled={disabled}><UsersRound size={22}/><span>{verification.label}</span><span className="wifi-network__selection" aria-hidden="true">{choice === verification.id ? <Check size={16}/> : <span/>}</span></button>
    </div>
  </section>;
}
