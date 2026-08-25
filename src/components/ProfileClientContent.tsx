"use client";

import { useSession, signOut } from "next-auth/react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import AuthGuard from "@/components/AuthGuard";
import { User, Mail, Shield, LogOut, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileClientContent() {
  const { data: session } = useSession();
  const t = useTranslations("profile");
  const locale = useLocale();

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.href = `/${locale}/auth/login`;
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
        <div className="bg-[#01411C] text-white p-8 rounded-3xl shadow-xl flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-400 text-[#01411C] flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
            {session?.user?.name?.[0] || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-black">{session?.user?.name || "Student User"}</h1>
            <p className="text-xs text-emerald-100/90 font-mono mt-0.5">{session?.user?.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-[#01411C]" />
            <span>Account Details</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{t("name")}</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 font-medium">
                {session?.user?.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{t("email")}</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 font-medium font-mono">
                {session?.user?.email}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Account Status</label>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Verified Pakistani Student Account</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full py-3 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
