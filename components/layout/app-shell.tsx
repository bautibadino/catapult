import { DashboardHeader } from "./dashboard-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col bg-[#FAFAFA]">
      <DashboardHeader />
      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {children}
      </main>
      <footer className="border-t border-[#F0F0F0] bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-[#A3A3A3] font-medium">
            Datos provistos por{" "}
            <span className="text-[#F26522] font-bold">cámaras GPS Catapult</span>
            {" "}· PF{" "}
            <span className="text-[#0A0A0A] font-bold">Lorenzo Badino</span>
          </p>
          <p className="text-[11px] text-[#C4C4C4]">
            Apertura 2026 · ADIUR Primera
          </p>
        </div>
      </footer>
    </div>
  );
}
