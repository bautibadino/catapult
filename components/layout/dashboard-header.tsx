"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Upload, Activity } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/import", label: "Importar", icon: Upload },
];

export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F26522] to-[#D54E0E] flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-orange-500/20">
              AD
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">
                ADIUR Primera
              </h1>
              <p className="text-[10px] text-[#707070] font-semibold mt-0.5 uppercase tracking-wider">
                Informe GPS
              </p>
            </div>
          </Link>

          {/* Separator */}
          <div className="hidden md:block w-px h-8 bg-white/10" />

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200",
                    isActive
                      ? "bg-white/10 text-[#F26522]"
                      : "text-[#707070] hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* PF Badge */}
          <div className="hidden lg:flex items-center gap-2.5 bg-white/5 rounded-xl px-4 py-2">
            <Activity className="w-4 h-4 text-[#F26522]" />
            <div className="text-right">
              <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                Preparación física
              </div>
              <div className="text-xs font-extrabold text-white">
                Lorenzo Badino
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
