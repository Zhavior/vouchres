import { Outlet } from "react-router-dom";
import { TopNav, BottomNav } from "@/components/navigation";
import { CyberBackground } from "@/components/cyber-background";

export function AppLayout() {
  return (
    <div className="min-h-screen relative">
      <CyberBackground />
      <TopNav />
      <main className="relative max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
