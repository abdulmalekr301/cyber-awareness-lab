import { Battery, Check, ChevronLeft, LockKeyhole, LockKeyholeOpen, Wifi } from "lucide-react";
import { WifiSignal } from "./WifiSignal";

type Props = { actions: { id: string; label: string }[]; choice: string; onChoice: (id: string) => void; disabled: boolean; isArabic: boolean };
const networks = [
  { action: "caution-campus", name: "Campus_WiFi", protected: true, strength: 3 },
  { action: "caution-guest-free", name: "Campus_Guest_Free", protected: false, strength: 4 },
  { action: "caution-campus-5g", name: "Campus_WiFi_5G", protected: true, strength: 2 },
];

export function WifiTrap({ actions, choice, onChoice, disabled, isArabic }: Props) {
  const selected = networks.find((network) => network.action === choice);
  return <section className="wifi-lab" aria-label={isArabic ? "محاكاة اختيار شبكة الواي فاي" : "Simulated Wi-Fi selection"}>
    <div className="wifi-phone">
      <div className="wifi-phone__status" dir="ltr"><span>9:41</span><span className="wifi-phone__notch"/><span><Wifi size={14}/><Battery size={17}/></span></div>
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
          <span>{isArabic ? "الشبكة التي اخترت الحذر منها أكثر" : "Network you would be most cautious about"}</span>
          <p>{selected ? <bdi>{selected.name}</bdi> : (isArabic ? "لم تحدد شبكة بعد" : "No network selected yet")}</p>
        </div>
        <p className="wifi-simulation-note">{isArabic ? "اختيار تدريبي فقط. لن يتصل جهازك بأي شبكة، ولن نطلب كلمة مرور." : "Training selection only. Your device will not connect to a network, and no password is requested."}</p>
      </div>
    </div>
  </section>;
}
