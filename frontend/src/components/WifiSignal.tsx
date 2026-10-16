import { Wifi, WifiHigh, WifiLow } from "lucide-react";

export function WifiSignal({ strength, isArabic }: { strength: number; isArabic: boolean }) {
  const Icon = strength >= 4 ? Wifi : strength >= 3 ? WifiHigh : WifiLow;
  return <span className="wifi-network__signal" role="img" aria-label={isArabic ? `قوة الإشارة ${strength} من 4` : `Signal strength ${strength} of 4`}><Icon size={28} aria-hidden="true"/></span>;
}
