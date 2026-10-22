"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, Users, Settings, LogOut, LayoutDashboard, CalendarDays, UserCircle, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const { user, userName, permissions } = useStore();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => await signOut(auth);

  const navItems = [
    { name: "Vezérlőpult", href: "/admin", icon: LayoutDashboard, show: true },
    { name: "Hírek kezelése", href: "/admin/news", icon: Newspaper, show: permissions?.manageNews || false },
    { name: "Órarendek", href: "/admin/timetable", icon: CalendarDays, show: permissions?.manageTimetable || false },
    { name: "Felhasználók", href: "/admin/users", icon: Users, show: permissions?.manageUsers || false },
    { name: "Rendszer", href: "/admin/settings", icon: Settings, show: permissions?.manageSettings || false },
  ];

  // A menü tartalma újrahasznosítva mobilon és asztali gépen
  const MenuContent = () => (
    <>
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-4 px-5 py-4 rounded-[1.2rem] text-[15px] font-bold transition-all ${
                isActive 
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/40"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-4 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 border border-blue-500/30">
            <UserCircle className="w-6 h-6 text-blue-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{userName || "Felhasználó"}</p>
            <p className="text-xs font-medium text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95"
        >
          <LogOut className="w-5 h-5" /> Kijelentkezés
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* MOBIL HEADER (Csak kis képernyőn látszik) */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-[#121212]/80 backdrop-blur-xl border-b border-white/10 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.6)]"></div>
          <h2 className="text-xl font-black text-white tracking-tight">Kiosk Admin</h2>
        </div>
        <button onClick={() => setIsMobileOpen(true)} className="p-2 bg-white/5 rounded-xl border border-white/10 text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* MOBIL SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-80 bg-[#0a0a0a] border-r border-white/10 shadow-2xl z-50 flex flex-col"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>
                  <h2 className="text-xl font-black text-white tracking-tight">Báthory Kiosk</h2>
                </div>
                <button onClick={() => setIsMobileOpen(false)} className="p-2 bg-white/5 rounded-xl border border-white/10 text-white/50 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <MenuContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ASZTALI SIDEBAR (Csak közepes és nagy képernyőn) */}
      <div className="hidden md:flex w-80 bg-[#0a0a0a] border-r border-white/10 flex-col justify-between shrink-0 shadow-2xl z-20 relative">
        <div className="h-24 flex items-center px-10 border-b border-white/10 shrink-0">
          <div className="w-3 h-8 bg-blue-600 rounded-full mr-4 shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">Kiosk Admin</h2>
        </div>
        <MenuContent />
      </div>
    </>
  );
}