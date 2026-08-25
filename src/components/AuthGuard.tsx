"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    if (status === "unauthenticated" && !isAuthPage) {
      router.push("/auth/login");
    } else if (status === "authenticated" && isAuthPage) {
      router.push("/");
    }
  }, [status, isAuthPage, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#01411C]" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
