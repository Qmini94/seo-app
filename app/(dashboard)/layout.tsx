"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/recommend", label: "AI 키워드 추천", icon: "🤖" },
  { href: "/keywords", label: "키워드 리서치", icon: "🔍" },
  { href: "/serp", label: "SERP 분석", icon: "📊" },
  // { href: "/audit", label: "사이트 진단", icon: "🩺" },
  // { href: "/rank", label: "순위 추적", icon: "📈" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r bg-muted/40 flex flex-col">
        <div className="p-4">
          <h1 className="text-lg font-bold tracking-tight">SEO 분석</h1>
          <p className="text-xs text-muted-foreground">네이버 키워드 도구</p>
        </div>
        <Separator />
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-muted-foreground">v0.1.0 MVP</div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
