"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { GraduationCap, Home, GitCompare, Menu, X } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function TopNavigation() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/universities", label: t("universities"), icon: GraduationCap },
    { href: "/compare", label: t("compare"), icon: GitCompare }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/30 bg-[#01411C] text-white shadow-lg">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-[#01411C] shadow-md"><GraduationCap className="h-5 w-5" /></span>
          <span className="font-extrabold tracking-tight">Pak University <span className="text-amber-300">{locale === "ur" ? "مشیر" : "Advisor"}</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-emerald-800 text-amber-300" : "text-emerald-100 hover:bg-emerald-900 hover:text-white"}`}><Icon className="h-4 w-4" />{label}</Link>;
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button type="button" onClick={() => setIsOpen(open => !open)} className="rounded-lg p-2 text-emerald-100 hover:bg-emerald-900 md:hidden" aria-label="Toggle navigation" aria-expanded={isOpen}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {isOpen && <nav className="border-t border-emerald-800 bg-[#01411C] px-4 py-3 md:hidden" aria-label="Mobile navigation">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-900"><Icon className="h-4 w-4" />{label}</Link>)}
      </nav>}
    </header>
  );
}
