"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { 
  Home, 
  GraduationCap, 
  GitCompare, 
  Heart, 
  Sparkles, 
  Award, 
  User, 
  Menu, 
  X, 
  LogOut, 
  LogIn 
} from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useSession, signOut } from "next-auth/react";

export default function SidePanel() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const navItems = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/universities", label: t("universities"), icon: GraduationCap },
    { href: "/compare", label: t("compare"), icon: GitCompare },
    { href: "/shortlist", label: t("shortlist"), icon: Heart },
    { href: "/profile", label: t("profile"), icon: User },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#01411C] text-white sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-amber-400">
          <GraduationCap className="w-6 h-6" />
          <span>Pak Uni Advisor</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={toggleSidebar} className="p-2 text-white hover:text-amber-400">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed lg:sticky top-0 left-0 bottom-0 z-50 lg:z-30
        w-64 bg-[#01411C] text-white flex flex-col justify-between
        h-screen transition-transform duration-300 ease-in-out shadow-xl
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div>
          {/* Header Branding */}
          <div className="p-6 border-b border-emerald-800/60 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#01411C] flex items-center justify-center font-black shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white">
                  Pak University
                </h1>
                <span className="text-xs text-amber-400 font-medium">Advisor • مشیر</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                    ${isActive 
                      ? "bg-emerald-800/90 text-amber-300 font-semibold shadow-inner border-l-4 border-amber-400" 
                      : "text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-emerald-300"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls & User status */}
        <div className="p-4 border-t border-emerald-800/60 space-y-3 bg-emerald-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-200 font-medium">Language / زبان</span>
            <LanguageSwitcher />
          </div>

          {session?.user ? (
            <div className="pt-2 border-t border-emerald-800/40">
              <div className="flex items-center gap-3 mb-2 px-2">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-400/40">
                  {session.user.name?.[0] || "U"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{session.user.name}</p>
                  <p className="text-[10px] text-emerald-300/70 truncate">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-200 hover:bg-red-950/40 hover:text-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("logout")}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#01411C] font-bold text-xs shadow-md transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>{t("login")}</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
