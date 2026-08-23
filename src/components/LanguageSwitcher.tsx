"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "ur" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 border-emerald-700/30 bg-emerald-950/40 text-emerald-100 hover:bg-emerald-800 hover:text-white transition-all shadow-sm rounded-full px-3 py-1.5 text-xs font-semibold"
    >
      <Globe className="w-4 h-4 text-amber-400" />
      <span>{locale === "en" ? "اردو (UR)" : "English (EN)"}</span>
    </Button>
  );
}
