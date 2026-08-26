"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

function MobileMenuButton() {
  const { setOpenMobile } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={() => setOpenMobile(true)}
      aria-label="Toggle menu"
    >
      <Menu className="size-4" />
    </Button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [defaultOpen] = useState(() => {
    if (typeof document === "undefined") return true;
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("sidebar_state="));
    return match?.split("=")[1] !== "false";
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />

      <SidebarInset>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:hidden">
          <span className="font-heading text-base font-semibold tracking-tight">
            Papermind
          </span>
          <MobileMenuButton />
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}